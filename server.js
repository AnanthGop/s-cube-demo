
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001; // Port dedicated to S3 Backend
const DATA_DIR = path.join(__dirname, 'jsonfiles');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists on startup
if (!fs.existsSync(DATA_DIR)) {
  console.log('--- Initializing physical storage directory: jsonfiles/ ---');
  fs.mkdirSync(DATA_DIR);
}

// Helper to get file path
const getFilePath = (moduleId) => path.join(DATA_DIR, `${moduleId}.json`);

// GET: Retrieve data for a module
app.get('/api/data/:moduleId', (req, res) => {
  const { moduleId } = req.params;
  const filePath = getFilePath(moduleId);

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      console.log(`[READ] Module: ${moduleId}`);
      return res.json(JSON.parse(data));
    } catch (err) {
      console.error(`Error reading ${moduleId}:`, err);
      return res.status(500).json({ error: 'Failed to read data file' });
    }
  } else {
    console.log(`[404] Module ${moduleId} not found, client should initialize.`);
    return res.status(404).json({ error: 'File not found' });
  }
});

// POST: Persist data for a module
app.post('/api/data/:moduleId', (req, res) => {
  const { moduleId } = req.params;
  const data = req.body;
  const filePath = getFilePath(moduleId);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[WRITE] Module: ${moduleId} saved to disk.`);
    res.json({ success: true, message: `Data persisted to ${moduleId}.json` });
  } catch (err) {
    console.error(`Error writing ${moduleId}:`, err);
    res.status(500).json({ error: 'Failed to write to disk' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'connected', 
    server: 'S3-Node-v1',
    storage: DATA_DIR,
    timestamp: new Date().toISOString() 
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
