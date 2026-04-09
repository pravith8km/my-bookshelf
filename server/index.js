const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;
const DB_PATH = path.join(__dirname, "books.db");

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─── sql.js setup (pure JS SQLite, no native build needed) ───
let db;

async function initDB() {
  const initSqlJs = require("sql.js");
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      author     TEXT    NOT NULL,
      genre      TEXT,
      year       INTEGER,
      rating     INTEGER DEFAULT 0,
      status     TEXT    DEFAULT 'To Read',
      notes      TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    )
  `);

  persist();
  console.log("✅ SQLite (sql.js) database ready");
}

function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

// ─── Routes ──────────────────────────────────────────────────

app.get("/api/books", (req, res) => {
  res.json(query("SELECT * FROM books ORDER BY id DESC"));
});

app.get("/api/books/:id", (req, res) => {
  const rows = query("SELECT * FROM books WHERE id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "Book not found" });
  res.json(rows[0]);
});

app.post("/api/books", (req, res) => {
  const { title, author, genre, year, rating, status, notes } = req.body;
  if (!title?.trim() || !author?.trim())
    return res.status(400).json({ error: "Title and author are required" });

  run(
    `INSERT INTO books (title, author, genre, year, rating, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title.trim(), author.trim(), genre || null, year ? parseInt(year) : null,
     rating || 0, status || "To Read", notes || null]
  );
  const rows = query("SELECT * FROM books ORDER BY id DESC LIMIT 1");
  res.status(201).json(rows[0]);
});

app.put("/api/books/:id", (req, res) => {
  const { title, author, genre, year, rating, status, notes } = req.body;
  if (!query("SELECT id FROM books WHERE id = ?", [req.params.id]).length)
    return res.status(404).json({ error: "Book not found" });

  run(
    `UPDATE books SET title=?, author=?, genre=?, year=?, rating=?, status=?, notes=?
     WHERE id=?`,
    [title?.trim(), author?.trim(), genre || null, year ? parseInt(year) : null,
     rating || 0, status || "To Read", notes || null, req.params.id]
  );
  res.json(query("SELECT * FROM books WHERE id = ?", [req.params.id])[0]);
});

app.delete("/api/books/:id", (req, res) => {
  if (!query("SELECT id FROM books WHERE id = ?", [req.params.id]).length)
    return res.status(404).json({ error: "Book not found" });
  run("DELETE FROM books WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ─── Start ───────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Bookshelf API running at http://localhost:${PORT}`)
  );
});
