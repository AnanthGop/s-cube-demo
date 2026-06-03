const fs = require("fs");
const os = require("os");
const path = require("path");
const PDFParser = require("pdf2json");
const mammoth = require("mammoth");
const XLSX = require("xlsx");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const decodePdfText = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_err) {
    return String(value || "");
  }
};

const parsePdfEmbeddedText = (buffer) =>
  new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", (errData) => {
      reject(new Error(errData?.parserError || "PDF parse failed"));
    });
    parser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const pages = Array.isArray(pdfData?.Pages) ? pdfData.Pages : [];
        const pageTexts = pages.map((page) => {
          const rows = Array.isArray(page?.Texts) ? page.Texts : [];
          const words = rows.flatMap((row) => {
            const runs = Array.isArray(row?.R) ? row.R : [];
            return runs
              .map((run) => decodePdfText(run?.T))
              .filter((chunk) => chunk.trim().length > 0);
          });
          return words.join(" ");
        });
        resolve(pageTexts.join("\n\n"));
      } catch (err) {
        reject(err);
      }
    });
    parser.parseBuffer(buffer);
  });

const findExecutableInPath = async (command) => {
  try {
    const { stdout } = await execFileAsync("where", [command], {
      windowsHide: true,
    });
    return String(stdout || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
  } catch (_err) {
    return null;
  }
};

const resolveExecutable = async (command) => {
  const fromPath = await findExecutableInPath(command);
  if (fromPath) return fromPath;
  const known = {
    tesseract: [
      "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
      "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
    ],
    pdftoppm: [
      "C:\\poppler\\poppler-25.12.0\\Library\\bin\\pdftoppm.exe",
      "C:\\poppler\\poppler-25.07.0\\Library\\bin\\pdftoppm.exe",
    ],
  };
  for (const p of known[command] || []) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const runCommand = async (command, args, timeoutMs = 120000) => {
  const { stdout } = await execFileAsync(command, args, {
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024,
  });
  return String(stdout || "");
};

const parsePdfWithOcr = async (buffer) => {
  const pdftoppmCmd = await resolveExecutable("pdftoppm");
  const tesseractCmd = await resolveExecutable("tesseract");
  if (!pdftoppmCmd || !tesseractCmd) {
    return {
      text: "",
      method: null,
      missingTools: [
        ...(pdftoppmCmd ? [] : ["pdftoppm (Poppler)"]),
        ...(tesseractCmd ? [] : ["tesseract"]),
      ],
    };
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "s-cube-ocr-"));
  const pdfPath = path.join(workDir, "input.pdf");
  const imagePrefix = path.join(workDir, "page");
  try {
    fs.writeFileSync(pdfPath, buffer);
    await runCommand(pdftoppmCmd, ["-png", "-r", "200", pdfPath, imagePrefix]);

    const pngFiles = fs
      .readdirSync(workDir)
      .filter((f) => /^page-\d+\.png$/i.test(f))
      .sort((a, b) => {
        const na = Number((a.match(/\d+/) || ["0"])[0]);
        const nb = Number((b.match(/\d+/) || ["0"])[0]);
        return na - nb;
      });

    const pageTexts = [];
    for (const pngFile of pngFiles) {
      const pngPath = path.join(workDir, pngFile);
      const ocrOut = await runCommand(
        tesseractCmd,
        [pngPath, "stdout", "-l", "eng"],
        180000,
      );
      if (ocrOut.trim()) pageTexts.push(ocrOut.trim());
    }
    return {
      text: pageTexts.join("\n\n").trim(),
      method: "pdf_ocr",
      missingTools: [],
    };
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (_err) {
      // best-effort cleanup
    }
  }
};

const parseDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return String(result?.value || "").trim();
};

const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parts = [];
  for (const sheetName of workbook.SheetNames.slice(0, 6)) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    let csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
    if (csv.length > 20000) csv = csv.slice(0, 20000);
    if (csv.trim()) {
      parts.push(`Sheet: ${sheetName}\n${csv}`);
    }
  }
  return parts.join("\n\n").trim();
};

const extractTextFromUploadedFile = async (file) => {
  if (!file?.buffer || !file.originalname) {
    const err = new Error("No valid file uploaded");
    err.statusCode = 400;
    throw err;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();
  const buffer = file.buffer;

  if (ext === ".pdf" || mime === "application/pdf") {
    const embedded = String(await parsePdfEmbeddedText(buffer)).trim();
    if (embedded) return { text: embedded, method: "pdf_embedded_text" };
    const ocr = await parsePdfWithOcr(buffer);
    if (ocr.text) return { text: ocr.text, method: ocr.method };
    const err = new Error(
      ocr.missingTools.length > 0 ?
        `No readable text in PDF. Missing OCR tools: ${ocr.missingTools.join(", ")}`
      : "No readable text found in PDF",
    );
    err.statusCode = 422;
    throw err;
  }

  if (ext === ".docx") {
    const text = await parseDocx(buffer);
    if (!text) {
      const err = new Error("No readable text found in DOCX");
      err.statusCode = 422;
      throw err;
    }
    return { text, method: "docx_raw_text" };
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const text = parseExcel(buffer);
    if (!text) {
      const err = new Error("No readable text found in Excel file");
      err.statusCode = 422;
      throw err;
    }
    return { text, method: "excel_sheet_csv" };
  }

  if ([".txt", ".csv", ".md", ".json"].includes(ext)) {
    const text = buffer.toString("utf8").trim();
    if (!text) {
      const err = new Error("No readable text found in text file");
      err.statusCode = 422;
      throw err;
    }
    return { text, method: "plain_text" };
  }

  const err = new Error(
    "Unsupported file type. Use PDF, DOCX, XLSX/XLS, TXT, CSV, or JSON.",
  );
  err.statusCode = 415;
  throw err;
};

module.exports = {
  extractTextFromUploadedFile,
};

