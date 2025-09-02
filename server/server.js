import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'dashboard-content.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

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

// ==== News Endpoints (stored inside dashboard-content.json under content.news) ====
function readNewsArray() {
  const data = readContent();
  if (!data) return [];
  if (!data.content.news) data.content.news = [];
  return data.content.news;
}

function writeNewsArray(newsArray) {
  const data = readContent() || { content: {}, history: [] };
  data.content.news = newsArray;
  writeContent(data);
  return data.content.news;
}

// Get all news
app.get('/api/news', (_req, res) => {
  try {
    const news = readNewsArray();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read news', details: err.message });
  }
});

// Create news post
app.post('/api/news', (req, res) => {
  try {
    const { id, title, description, images, datetime, bigImage } = req.body || {};
    if (!id || !title) return res.status(400).json({ error: 'Missing id or title' });
    const news = readNewsArray();
    const post = { id, title, description: description || '', images: Array.isArray(images) ? images : [], datetime: datetime || new Date().toISOString(), bigImage: !!bigImage };
    news.push(post);
    writeNewsArray(news);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create news', details: err.message });
  }
});

// Delete news post
app.delete('/api/news/:id', (req, res) => {
  try {
    const id = req.params.id;
    let news = readNewsArray();
    const before = news.length;
    news = news.filter(n => n.id !== id);
    writeNewsArray(news);
    if (news.length === before) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete news', details: err.message });
  }
});

// Upload images (multiple)
app.post('/api/news/upload', upload.array('images', 10), (req, res) => {
  try {
    const files = req.files || [];
    const urls = Array.isArray(files) ? files.map(f => '/uploads/' + f.filename) : [];
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Dashboard backend running on http://localhost:${PORT}`);
}); 