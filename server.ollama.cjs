const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PDFParser = require("pdf2json");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { extractTextFromUploadedFile } = require("./llm-file-context.cjs");

require("dotenv").config();

const app = express();
const PORT = Number(process.env.OLLAMA_EXTRACTOR_PORT || 3002);
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL?.trim() || "llama3.1:8b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 90000);
const OLLAMA_TEST_MAX_CHARS = Number(
  process.env.OLLAMA_TEST_MAX_CHARS || 30000,
);
const PROMPT_FEEDBACK_FILE =
  process.env.PROMPT_FEEDBACK_FILE?.trim() ||
  path.join(__dirname, "json_files", "llm_prompt_feedback.json");

const upload = multer({ storage: multer.memoryStorage() });
const execFileAsync = promisify(execFile);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const ensureFeedbackFile = () => {
  const dir = path.dirname(PROMPT_FEEDBACK_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROMPT_FEEDBACK_FILE)) {
    fs.writeFileSync(PROMPT_FEEDBACK_FILE, "[]", "utf8");
  }
};

const readPromptFeedback = () => {
  try {
    ensureFeedbackFile();
    const raw = fs.readFileSync(PROMPT_FEEDBACK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
};

const writePromptFeedback = (rows) => {
  ensureFeedbackFile();
  fs.writeFileSync(
    PROMPT_FEEDBACK_FILE,
    JSON.stringify(Array.isArray(rows) ? rows : [], null, 2),
    "utf8",
  );
};

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
};

const normalizeFeedbackEntry = (body) => {
  const provider = trimOrNull(body?.provider) || "ollama";
  const model = trimOrNull(body?.model);
  const fileName = trimOrNull(body?.fileName);
  const issueType = trimOrNull(body?.issueType) || "missed_content";
  const sectionName = trimOrNull(body?.sectionName);
  const expectedText = trimOrNull(body?.expectedText);
  const comment = trimOrNull(body?.comment);
  let promptInstruction = trimOrNull(body?.promptInstruction);

  if (!promptInstruction) {
    const sectionPart = sectionName ? `section '${sectionName}'` : "all sections";
    const expectedPart = expectedText ? ` Include: ${expectedText}` : "";
    promptInstruction =
      `Do not miss ${sectionPart}. Extract it explicitly and include factual details only.` +
      expectedPart;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    provider,
    model,
    fileName,
    issueType,
    sectionName,
    expectedText,
    comment,
    promptInstruction,
    active: true,
    createdAt: new Date().toISOString(),
  };
};

const getPromptInstructionsFromFeedback = ({
  provider,
  model,
  fileName,
  limit = 8,
}) => {
  const rows = readPromptFeedback()
    .filter((row) => row && row.active !== false)
    .filter((row) => {
      const providerOk = !row.provider || row.provider === provider;
      const modelOk = !row.model || row.model === model;
      const fileOk = !row.fileName || row.fileName === fileName;
      return providerOk && modelOk && fileOk;
    })
    .slice(-40);

  const dedup = [];
  const seen = new Set();
  for (const row of rows) {
    const text = trimOrNull(row?.promptInstruction);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(text);
    if (dedup.length >= limit) break;
  }
  return dedup;
};

const decodePdfText = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (_err) {
    return String(value || "");
  }
};

const extractPdfTextFromBuffer = (buffer) =>
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
    const firstLine = String(stdout || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    return firstLine || null;
  } catch (_err) {
    return null;
  }
};

const runCommand = async (command, args, timeoutMs = 120000) => {
  const { stdout } = await execFileAsync(command, args, {
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024,
  });
  return String(stdout || "");
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

  const candidates = known[command] || [];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const extractPdfTextWithOcrTools = async (buffer) => {
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

    if (pngFiles.length === 0) {
      return { text: "", method: null, missingTools: [] };
    }

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
      method: "ocr_pdftoppm_tesseract",
      missingTools: [],
    };
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (_err) {
      // Best-effort cleanup
    }
  }
};

const EMPTY_SCHEMA_RESULT = {
  vendorName: null,
  location: null,
  postingFrequency: null,
  panNo: null,
  bankDetails: null,
  email: null,
  contactNumber: null,
  address: null,
  agreementSignedBy: null,
  budgetCode: null,
  agreementStartDate: null,
  agreementEndDate: null,
  autoPosting: null,
  autoPostingDate: null,
  grossAmount: null,
  gstPercent: null,
  tdsRuleName: null,
};

const coerceStringOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};

const coerceNumberOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeConsultantData = (raw) => {
  const normalized = {
    ...EMPTY_SCHEMA_RESULT,
    vendorName: coerceStringOrNull(raw?.vendorName),
    location: coerceStringOrNull(raw?.location),
    postingFrequency: coerceStringOrNull(raw?.postingFrequency),
    panNo: coerceStringOrNull(raw?.panNo),
    bankDetails: coerceStringOrNull(raw?.bankDetails),
    email: coerceStringOrNull(raw?.email),
    contactNumber: coerceStringOrNull(raw?.contactNumber),
    address: coerceStringOrNull(raw?.address),
    agreementSignedBy: coerceStringOrNull(raw?.agreementSignedBy),
    budgetCode: coerceStringOrNull(raw?.budgetCode),
    agreementStartDate: coerceStringOrNull(raw?.agreementStartDate),
    agreementEndDate: coerceStringOrNull(raw?.agreementEndDate),
    autoPosting: coerceStringOrNull(raw?.autoPosting),
    autoPostingDate: coerceStringOrNull(raw?.autoPostingDate),
    grossAmount: coerceNumberOrNull(raw?.grossAmount),
    gstPercent: coerceNumberOrNull(raw?.gstPercent),
    tdsRuleName: coerceStringOrNull(raw?.tdsRuleName),
  };

  if (normalized.autoPosting) {
    const upper = normalized.autoPosting.toUpperCase();
    normalized.autoPosting = upper === "Y" || upper === "YES" ? "Y" : "N";
  }

  return normalized;
};

const parseModelJson = (text) => {
  if (!text || typeof text !== "string") return {};
  try {
    return JSON.parse(text);
  } catch (_err) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const body = text.slice(start, end + 1);
      return JSON.parse(body);
    }
  }
  return {};
};

app.get("/api/test-llms/feedback", (req, res) => {
  try {
    const provider = trimOrNull(req.query?.provider);
    const model = trimOrNull(req.query?.model);
    const fileName = trimOrNull(req.query?.fileName);
    const rows = readPromptFeedback()
      .filter((row) => row && row.active !== false)
      .filter((row) => {
        const providerOk = !provider || !row.provider || row.provider === provider;
        const modelOk = !model || !row.model || row.model === model;
        const fileOk = !fileName || !row.fileName || row.fileName === fileName;
        return providerOk && modelOk && fileOk;
      })
      .slice(-100)
      .reverse();
    return res.json({ items: rows });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to read prompt feedback",
      details: error?.message || "Unknown error",
    });
  }
});

app.post("/api/test-llms/feedback", (req, res) => {
  try {
    const entry = normalizeFeedbackEntry(req.body || {});
    const rows = readPromptFeedback();
    rows.push(entry);
    const trimmed = rows.slice(-500);
    writePromptFeedback(trimmed);
    return res.status(201).json({
      ok: true,
      item: entry,
      message: "Feedback saved and will be used in future prompts.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to save prompt feedback",
      details: error?.message || "Unknown error",
    });
  }
});

app.post(
  "/api/extract-consultant-data-ollama",
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (
        req.file.mimetype !== "application/pdf" &&
        !String(req.file.originalname || "")
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        return res.status(400).json({
          error: "Only PDF attachments are supported in Ollama extractor",
        });
      }

      let pdfText = String(
        await extractPdfTextFromBuffer(req.file.buffer),
      ).trim();
      let extractionMethod = "embedded_pdf_text";
      if (!pdfText) {
        const ocrResult = await extractPdfTextWithOcrTools(req.file.buffer);
        if (ocrResult.text) {
          pdfText = ocrResult.text;
          extractionMethod = ocrResult.method || "ocr";
        } else if (ocrResult.missingTools.length > 0) {
          return res.status(422).json({
            error:
              "No readable text found in PDF and OCR fallback tools are not installed.",
            details:
              `Install missing tools: ${ocrResult.missingTools.join(", ")}. ` +
              "Then restart server.ollama.cjs.",
          });
        } else {
          return res.status(422).json({
            error: "No readable text found in PDF. Try OCR-enabled PDF.",
          });
        }
      }

      const clippedText = pdfText.slice(0, 60000);

      const prompt = [
        "Extract consultant agreement details from this text.",
        "Return strict JSON only with these keys:",
        JSON.stringify(Object.keys(EMPTY_SCHEMA_RESULT)),
        "Rules:",
        "- Use YYYY-MM-DD for dates when possible.",
        "- Use Y/N for autoPosting when inferable, else null.",
        "- Use number for grossAmount and gstPercent.",
        "- Use null for missing values.",
        "",
        "PDF TEXT:",
        clippedText,
      ].join("\n");

      const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          format: "json",
          options: {
            temperature: 0.1,
          },
        }),
      });

      if (!ollamaResponse.ok) {
        const details = await ollamaResponse.text();
        return res.status(502).json({
          error: "Ollama request failed",
          details: details || `HTTP ${ollamaResponse.status}`,
        });
      }

      const payload = await ollamaResponse.json();
      const parsed = parseModelJson(payload?.response);
      const normalized = normalizeConsultantData(parsed);

      return res.json({
        ...normalized,
        __extractionSource: "server.ollama.cjs:extract-consultant-data-ollama",
        __model: OLLAMA_MODEL,
        __extractionMethod: extractionMethod,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to extract data from attachment",
        details: error?.message || "Unknown error",
      });
    }
  },
);

app.post("/api/test-llms/ollama", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { text: extractedText, method } = await extractTextFromUploadedFile(
      req.file,
    );
    const clippedText = extractedText.slice(0, OLLAMA_TEST_MAX_CHARS);
    const extraRules = getPromptInstructionsFromFeedback({
      provider: "ollama",
      model: OLLAMA_MODEL,
      fileName: req.file.originalname,
    });

    const prompt = [
      "You are reading a document and producing context summary.",
      "Return strict JSON only with keys:",
      JSON.stringify([
        "title",
        "language",
        "documentType",
        "summary",
        "context",
        "dateMentions",
        "keyEntities",
        "keyPoints",
      ]),
      "Rules:",
      "- dateMentions should include dates exactly as seen in document.",
      "- Keep summary concise and factual.",
      ...(extraRules.length > 0 ?
        [
          "- Additional rules learned from prior feedback:",
          ...extraRules.map((rule, idx) => `  ${idx + 1}. ${rule}`),
        ]
      : []),
      "",
      "DOCUMENT TEXT:",
      clippedText,
    ].join("\n");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
    let ollamaResponse;
    try {
      ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          format: "json",
          options: { temperature: 0.1 },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        return res.status(504).json({
          error: "Ollama request timed out",
          details:
            `No response from model '${OLLAMA_MODEL}' within ${OLLAMA_TIMEOUT_MS}ms. ` +
            "Try a smaller/cleaner file or increase OLLAMA_TIMEOUT_MS.",
        });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!ollamaResponse.ok) {
      const details = await ollamaResponse.text();
      return res.status(502).json({
        error: "Ollama request failed",
        details: details || `HTTP ${ollamaResponse.status}`,
      });
    }

    const payload = await ollamaResponse.json();
    const parsed = parseModelJson(payload?.response);
    return res.json({
      title: parsed?.title ?? null,
      language: parsed?.language ?? null,
      documentType: parsed?.documentType ?? null,
      summary: parsed?.summary ?? null,
      context: parsed?.context ?? null,
      dateMentions: Array.isArray(parsed?.dateMentions) ? parsed.dateMentions : [],
      keyEntities: Array.isArray(parsed?.keyEntities) ? parsed.keyEntities : [],
      keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [],
      __provider: "ollama",
      __model: OLLAMA_MODEL,
      __fileName: req.file.originalname,
      __extractionMethod: method,
      __textPreview: clippedText.slice(0, 2500),
      __textLength: extractedText.length,
      __feedbackRulesApplied: extraRules,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({
      error: "Failed to process file with Ollama",
      details: error?.message || "Unknown error",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "connected",
    server: "S3-Ollama-Extractor-v1",
    model: OLLAMA_MODEL,
    ollamaBaseUrl: OLLAMA_BASE_URL,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`
========================================
  S3 OLLAMA EXTRACTOR STARTED
========================================
  URL: http://localhost:${PORT}
  Model: ${OLLAMA_MODEL}
  Ollama: ${OLLAMA_BASE_URL}
========================================
`);
});
