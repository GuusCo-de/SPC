import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
// ========== Persistent Storage Setup ==========
// Allow overriding data directory so content survives git operations / redeploys.
// Example: set env DASHBOARD_DATA_DIR=C:\\dashboard-data (Windows) or /var/data/dashboard
const DATA_DIR = process.env.DASHBOARD_DATA_DIR
  ? path.resolve(process.env.DASHBOARD_DATA_DIR)
  : path.join(__dirname, 'data'); // fallback inside server folder

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Legacy location (old file kept for migration) – we will migrate it if new file absent
const LEGACY_FILE = path.join(__dirname, 'dashboard-content.json');
const DATA_FILE = path.join(DATA_DIR, 'dashboard-content.json');

// Migrate legacy file to new location once
try {
  if (fs.existsSync(LEGACY_FILE) && !fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(LEGACY_FILE, DATA_FILE);
    // Optional: keep legacy file as fallback; comment next line to retain
    // fs.unlinkSync(LEGACY_FILE);
    console.log('[storage] Migrated legacy dashboard-content.json to data directory');
  }
} catch (e) {
  console.warn('[storage] Migration check failed:', e.message);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images (store inside DATA_DIR so they persist if a disk is mounted)
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
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

// ======== Simple JWT Auth ========
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user: { username } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

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
  // Atomic write: write to temp file then rename.
  const tmp = DATA_FILE + '.tmp';
  const json = JSON.stringify(content, null, 2);
  fs.writeFileSync(tmp, json, 'utf-8');
  fs.renameSync(tmp, DATA_FILE);
  // Lightweight backup rotation (keep last 5)
  try {
    const backupName = path.join(DATA_DIR, 'dashboard-content.' + Date.now() + '.bak.json');
    fs.writeFileSync(backupName, json, 'utf-8');
    const backups = fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('dashboard-content.') && f.endsWith('.bak.json'))
      .sort();
    // Remove oldest if over 5
    while (backups.length > 5) {
      const oldest = backups.shift();
      if (oldest) {
        try { fs.unlinkSync(path.join(DATA_DIR, oldest)); } catch {/* ignore */}
      }
    }
  } catch (e) {
    console.warn('[storage] Backup rotation failed:', e.message);
  }
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
app.post('/api/dashboard-content', authMiddleware, (req, res) => {
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

// ===== Backup utilities & endpoints =====
function listBackups() {
  try {
    return fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('dashboard-content.') && f.endsWith('.bak.json'))
      .map(name => {
        const full = path.join(DATA_DIR, name);
        const stat = fs.statSync(full);
        return { name, size: stat.size, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

// Create & return a fresh backup (also returns the JSON so client can download directly)
app.get('/api/dashboard-content/backup', authMiddleware, (req, res) => {
  try {
    const current = readContent();
    if (!current) return res.status(404).json({ success: false, error: 'No content' });
    const ts = Date.now();
    const file = path.join(DATA_DIR, `dashboard-content.${ts}.bak.json`);
    const json = JSON.stringify(current, null, 2);
    fs.writeFileSync(file, json, 'utf-8');
    res.json({ success: true, filename: `dashboard-backup-${ts}.json`, createdAt: ts, content: current });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// List existing backups
app.get('/api/dashboard-content/backups', authMiddleware, (_req, res) => {
  res.json({ success: true, backups: listBackups() });
});

// Restore from backup name
app.post('/api/dashboard-content/restore', authMiddleware, (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: 'Missing backup name' });
  const target = path.join(DATA_DIR, name);
  if (!fs.existsSync(target)) return res.status(404).json({ success: false, error: 'Backup not found' });
  try {
    const raw = fs.readFileSync(target, 'utf-8');
    const parsed = JSON.parse(raw);
    writeContent(parsed);
    res.json({ success: true, restored: name });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
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
app.post('/api/news', authMiddleware, (req, res) => {
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
app.delete('/api/news/:id', authMiddleware, (req, res) => {
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
app.post('/api/news/upload', authMiddleware, upload.array('images', 10), (req, res) => {
  try {
    const files = req.files || [];
    const urls = Array.isArray(files) ? files.map(f => '/uploads/' + f.filename) : [];
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Generic background images upload
app.post('/api/backgrounds/upload', authMiddleware, upload.array('backgrounds', 15), (req, res) => {
  try {
    const files = req.files || [];
    const urls = Array.isArray(files) ? files.map(f => '/uploads/' + f.filename) : [];
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: 'Background upload failed', details: err.message });
  }
});

// ====== Game Rules Endpoints (content.gameRules) ======
function readRulesArray() {
  const data = readContent();
  if (!data) return [];
  if (!data.content.gameRules) data.content.gameRules = [];
  return data.content.gameRules;
}

function writeRulesArray(rulesArray) {
  const data = readContent() || { content: {}, history: [] };
  data.content.gameRules = rulesArray;
  writeContent(data);
  return data.content.gameRules;
}

// Get all rules
app.get('/api/rules', (_req, res) => {
  try {
    const rules = readRulesArray();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read rules', details: err.message });
  }
});

// Replace rules array (bulk save)
app.post('/api/rules', authMiddleware, (req, res) => {
  try {
    const rules = Array.isArray(req.body) ? req.body : req.body.rules;
    if (!Array.isArray(rules)) return res.status(400).json({ error: 'Expected array of rules' });
    const sanitized = rules.map(r => ({
      id: r.id || (Date.now().toString(36)+Math.random().toString(36).slice(2,8)),
      title: String(r.title || '').trim(),
      type: String(r.type || 'Pool').trim(),
      shortDescription: String(r.shortDescription || r.korteBeschrijving || '').trim(),
      details: Array.isArray(r.details) ? r.details.map(d => String(d)) : [],
      rules: Array.isArray(r.rules) ? r.rules.map(d => String(d)) : [],
      tips: Array.isArray(r.tips) ? r.tips.map(d => String(d)) : [],
      enabled: r.enabled !== false,
      order: typeof r.order === 'number' ? r.order : 0,
    }));
    const saved = writeRulesArray(sanitized.sort((a,b)=> (a.order||0)-(b.order||0)));
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save rules', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Dashboard backend running on http://localhost:${PORT}`);
}); 