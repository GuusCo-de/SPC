import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'dashboard-content.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Helper to read content
function readContent() {
  if (!fs.existsSync(DATA_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

// Helper to write content
function writeContent(content) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2), 'utf-8');
}

// GET current dashboard content
app.get('/api/dashboard-content', (req, res) => {
  const content = readContent();
  if (!content) {
    return res.status(404).json({ error: 'No content found' });
  }
  res.json(content);
});

// POST new dashboard content
app.post('/api/dashboard-content', (req, res) => {
  const { content, history } = req.body;
  if (!content || !history) {
    console.error('Missing content or history in POST /api/dashboard-content', req.body);
    return res.status(400).json({ error: 'Missing content or history' });
  }
  const toSave = { content, history };
  try {
    writeContent(toSave);
    // Read back the saved content to confirm
    const saved = readContent();
    if (!saved) {
      console.error('Failed to read back saved content after write');
      return res.status(500).json({ error: 'Failed to save content' });
    }
    res.json(saved);
  } catch (err) {
    console.error('Error writing dashboard content:', err);
    res.status(500).json({ error: 'Failed to save content', details: err.message });
  }
});

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '../build')));

// Catch-all: send back React's index.html for any non-API route
app.get('*', (req, res) => {
  // Only handle non-API routes
  if (req.path.startsWith('/api/')) return res.status(404).end();
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dashboard backend running on http://localhost:${PORT}`);
}); 