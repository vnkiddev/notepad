const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DB_FILE = 'notes.json';

// Load or initialize database
function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  }
  return {};
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = loadDb();

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
  
  if (db[slug]) {
    return res.status(409).json({ error: 'Slug already exists' });
  }
  
  const now = Date.now();
  db[slug] = {
    content: content,
    created_at: now,
    updated_at: now
  };
  
  saveDb(db);
  
  res.json({
    slug: slug,
    url: '/' + slug,
    raw: '/raw/' + slug
  });
});

// GET /api/paste/:slug - Get note
app.get('/api/paste/:slug', (req, res) => {
  const note = db[req.params.slug];
  
  if (!note) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json({ 
    slug: req.params.slug, 
    content: note.content 
  });
});

// PUT /api/paste/:slug - Update note
app.put('/api/paste/:slug', (req, res) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content required' });
  }
  
  const note = db[req.params.slug];
  
  if (!note) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  note.content = content;
  note.updated_at = Date.now();
  
  saveDb(db);
  
  res.json({ success: true });
});

// GET /raw/:slug - Plain text
app.get('/raw/:slug', (req, res) => {
  const note = db[req.params.slug];
  
  if (!note) {
    return res.status(404).send('Not found');
  }
  
  res.type('text/plain').send(note.content);
});

// Home page
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Note page - must be last to avoid conflicts with /api and /raw
app.get('/:slug', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'note.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', function() {
  console.log('Server running on http://0.0.0.0:' + PORT);
});
