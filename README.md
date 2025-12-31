# Notepad Clone

Minimal notepad.pw-inspired paste service.

## Features

- Plain text notes
- URL-based access (`/p/{slug}`)
- Optional custom URLs
- Anyone can view and edit
- Raw text endpoint (`/raw/{slug}`)

## Setup

```bash
npm install
npm start
```

Visit http://localhost:3000

## Usage

1. Type or paste text on the home page
2. Optionally enter a custom URL slug
3. Click "Save" to create a note
4. Share the URL with anyone
5. Anyone can edit and save changes
6. Use `/raw/{slug}` for plain text output

## Tech Stack

- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla HTML/CSS/JS
