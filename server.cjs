const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = 3001; // Port dedicated to S3 Backend
const DATA_DIR = path.join(__dirname, "json_files");

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Ensure data directory exists on startup
if (!fs.existsSync(DATA_DIR)) {
  console.log("--- Initializing physical storage directory: json_files/ ---");
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get file path
const getFilePath = (moduleId) => path.join(DATA_DIR, `${moduleId}.json`);

const extractionDisabled = (res, feature) =>
  res.status(501).json({
    error: `${feature} is disabled`,
    details: "This application is configured to run without OpenAI-based extraction.",
  });

// Middleware to handle all /api/data routes
app.use("/api/data", (req, res) => {
  // Capture everything after /api/data/
  // req.path will give us the remaining path after /api/data
  const moduleId = req.path.substring(1); // Remove leading slash
  const filePath = getFilePath(moduleId);

  if (req.method === "GET") {
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, "utf8");
        console.log(`[READ] Module: ${moduleId}`);
        return res.json(JSON.parse(data));
      } catch (err) {
        console.error(`Error reading ${moduleId}:`, err);
        return res.status(500).json({ error: "Failed to read data file" });
      }
    } else {
      console.log(
        `[404] Module ${moduleId} not found, client should initialize.`,
      );
      return res.status(404).json({ error: "File not found" });
    }
  }

  if (req.method === "POST") {
    const data = req.body;
    const dirPath = path.dirname(filePath);

    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(`[WRITE] Module: ${moduleId} saved to disk.`);
      return res.json({
        success: true,
        message: `Data persisted to ${moduleId}.json`,
      });
    } catch (err) {
      console.error(`Error writing ${moduleId}:`, err);
      return res.status(500).json({ error: "Failed to write to disk" });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
});

// Grant attachment extraction endpoint
app.post("/api/extract-grant-data", upload.single("pdf"), async (req, res) => {
  return extractionDisabled(res, "Grant attachment extraction");
});

const handleConsultantExtraction = async (req, res) => {
  return extractionDisabled(res, "Consultant attachment extraction");
};

// Consultant attachment extraction endpoints (legacy + v2)
app.post("/api/extract-consultant-data", upload.single("pdf"), handleConsultantExtraction);
app.post(
  "/api/extract-consultant-data-v2",
  upload.single("pdf"),
  handleConsultantExtraction,
);

app.post(
  "/api/extract-procurement-quotation",
  upload.single("pdf"),
  async (req, res) => extractionDisabled(res, "Procurement quotation extraction"),
);

app.post("/api/test-llms/openai", upload.single("file"), async (req, res) => {
  return extractionDisabled(res, "OpenAI file test");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "connected",
    server: "S3-Node-v1",
    storage: DATA_DIR,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`
  ========================================
    S3 ERP BACKEND STARTED
  ========================================
    URL: http://localhost:${PORT}
    Data: ${DATA_DIR}
    Status: Listening for sync...
  ========================================
  `);
});
