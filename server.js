const express = require('express');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const app = express();
const DB_FILE = 'notes.db';
let db;

// Init DB
(async () => {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      slug TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  
  saveDb();
})();

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, data);
}

app.use(express.json({ limit: '200kb' }));
app.use(express.static('public'));

// Generate random slug
function randomSlug() {
  return Math.random().toString(36).substring(2, 8);
}

// Validate slug
function isValidSlug(slug) {
  return /^[a-zA-Z0-9_-]+$/.test(slug) && slug.length <= 50;
}

// POST /api/paste - Create new note
app.post('/api/paste', (req, res) => {
  let { slug, content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content required' });
  }
  
  if (!slug) {
    slug = randomSlug();
  } else if (!isValidSlug(slug)) {
    return res.status(400).json({ error: 'Invalid slug format' });
  }
  
  const now = Date.now();
  
  try {
    const existing = db.exec('SELECT slug FROM notes WHERE slug = ?', [slug]);
    if (existing[0] && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    
    db.run('INSERT INTO notes (slug, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [slug, content, now, now]);
    saveDb();
    
    res.json({
      slug,
      url: `/${slug}`,
      raw: `/raw/${slug}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/paste/:slug - Get note
app.get('/api/paste/:slug', (req, res) => {
  const result = db.exec('SELECT slug, content FROM notes WHERE slug = ?', [req.params.slug]);
  
  if (!result[0] || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const [slug, content] = result[0].values[0];
  res.json({ slug, content });
});

// PUT /api/paste/:slug - Update note
app.put('/api/paste/:slug', (req, res) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content required' });
  }
  
  try {
    db.run('UPDATE notes SET content = ?, updated_at = ? WHERE slug = ?',
      [content, Date.now(), req.params.slug]);
    saveDb();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /raw/:slug - Plain text
app.get('/raw/:slug', (req, res) => {
  const result = db.exec('SELECT content FROM notes WHERE slug = ?', [req.params.slug]);
  
  if (!result[0] || result[0].values.length === 0) {
    return res.status(404).send('Not found');
  }
  
  res.type('text/plain').send(result[0].values[0][0]);
});

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Note page - must be last to avoid conflicts with /api and /raw
app.get('/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'note.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
