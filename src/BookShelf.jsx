import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/books";
const GENRES = ["Fiction", "Non-Fiction", "Science", "History", "Biography", "Fantasy", "Mystery", "Romance", "Self-Help", "Other"];
const STATUSES = ["To Read", "Reading", "Finished"];
const STATUS_COLORS = {
  "To Read":  { bg: "#FFF7ED", text: "#92400E", border: "#FCD34D" },
  "Reading":  { bg: "#EFF6FF", text: "#1E40AF", border: "#93C5FD" },
  "Finished": { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
};
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
const defaultForm = { title: "", author: "", genre: "", year: "", rating: 0, status: "To Read", notes: "" };

// ─── Star Rating ────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          style={{ fontSize: 22, cursor: "pointer", color: n <= (hovered || value) ? "#F59E0B" : "#D1D5DB", transition: "color 0.1s", userSelect: "none" }}>★</span>
      ))}
      {(hovered || value) > 0 && (
        <span style={{ fontSize: 12, color: "#6B7280", alignSelf: "center", marginLeft: 4 }}>
          {RATING_LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ─── Book Card ───────────────────────────────────────────────
function BookCard({ book, onEdit, onDelete }) {
  const sc = STATUS_COLORS[book.status];
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.2s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: sc.border, borderRadius: 0 }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ fontSize: 17, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#111827", lineHeight: 1.3, margin: 0 }}>{book.title}</h3>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>{book.status}</span>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0", fontStyle: "italic" }}>by {book.author}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 8 }}>
        {book.genre && <span style={{ fontSize: 11, background: "#F3F4F6", color: "#374151", padding: "2px 10px", borderRadius: 12, fontWeight: 500 }}>{book.genre}</span>}
        {book.year  && <span style={{ fontSize: 11, background: "#F3F4F6", color: "#374151", padding: "2px 10px", borderRadius: 12 }}>{book.year}</span>}
      </div>
      {book.rating > 0 && (
        <div style={{ paddingLeft: 8, display: "flex", gap: 2 }}>
          {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 16, color: n <= book.rating ? "#F59E0B" : "#E5E7EB" }}>★</span>)}
        </div>
      )}
      {book.notes && (
        <p style={{ fontSize: 13, color: "#6B7280", background: "#F9FAFB", borderRadius: 8, padding: "8px 12px", margin: "0 0 0 8px", lineHeight: 1.5, fontStyle: "italic", borderLeft: "2px solid #E5E7EB" }}>
          "{book.notes}"
        </p>
      )}
      <div style={{ display: "flex", gap: 8, paddingLeft: 8, marginTop: 4 }}>
        <button onClick={() => onEdit(book)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Edit</button>
        <button onClick={() => onDelete(book.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #FCA5A5", background: "#FFF5F5", color: "#DC2626", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────
function Modal({ book, onClose, onSave, saving }) {
  const [form, setForm] = useState(book ? { ...book, year: book.year || "" } : defaultForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, color: "#111827", background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block", letterSpacing: "0.03em" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 28px 24px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            {book ? "Edit Book" : "Add New Book"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9CA3AF" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>TITLE *</label>
            <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Book title" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>AUTHOR *</label>
            <input style={inputStyle} value={form.author} onChange={e => set("author", e.target.value)} placeholder="Author name" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={labelStyle}>GENRE</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={form.genre} onChange={e => set("genre", e.target.value)}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={labelStyle}>YEAR</label>
              <input style={inputStyle} value={form.year} onChange={e => set("year", e.target.value)} placeholder="e.g. 2023" type="number" min="1000" max="2099" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>STATUS</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => set("status", s)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: form.status === s ? `2px solid ${STATUS_COLORS[s].border}` : "1px solid #E5E7EB", background: form.status === s ? STATUS_COLORS[s].bg : "#F9FAFB", color: form.status === s ? STATUS_COLORS[s].text : "#6B7280" }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>RATING</label>
            <StarRating value={form.rating} onChange={v => set("rating", v)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={labelStyle}>NOTES</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Your thoughts, quotes, or reminders..." />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => {
            if (!form.title.trim() || !form.author.trim()) return alert("Title and Author are required.");
            onSave(form);
          }} disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : book ? "Save Changes" : "Add Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function BookShelf() {
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [modal, setModal]           = useState(null);   // null=closed, {}=new, book=edit
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterGenre, setFilterGenre]   = useState("All");
  const [sort, setSort]             = useState("recent");

  // ── Fetch all books ──
  const fetchBooks = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API);
      if (!res.ok) throw new Error("Server error");
      setBooks(await res.json());
    } catch (e) {
      setError("Cannot connect to the server. Make sure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // ── Save (create or update) ──
  const saveBook = async (form) => {
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `${API}/${form.id}` : API, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
      const saved = await res.json();
      setBooks(bs => isEdit ? bs.map(b => b.id === saved.id ? saved : b) : [saved, ...bs]);
      setModal(null);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const deleteBook = async (id) => {
    if (!window.confirm("Remove this book from your shelf?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBooks(bs => bs.filter(b => b.id !== id));
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  // ── Filter & sort ──
  const usedGenres = [...new Set(books.map(b => b.genre).filter(Boolean))];
  const filtered = books
    .filter(b => {
      const q = search.toLowerCase();
      return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    })
    .filter(b => filterStatus === "All" || b.status === filterStatus)
    .filter(b => filterGenre === "All" || b.genre === filterGenre)
    .sort((a, b) => {
      if (sort === "title")  return a.title.localeCompare(b.title);
      if (sort === "author") return a.author.localeCompare(b.author);
      if (sort === "rating") return b.rating - a.rating;
      return b.id - a.id;
    });

  const stats = {
    total:    books.length,
    toRead:   books.filter(b => b.status === "To Read").length,
    reading:  books.filter(b => b.status === "Reading").length,
    finished: books.filter(b => b.status === "Finished").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#111827", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#fff", margin: 0 }}>My Bookshelf</h1>
              <p style={{ color: "#9CA3AF", fontSize: 14, margin: "4px 0 0" }}>{stats.total} books · SQLite database</p>
            </div>
            <button onClick={() => setModal({})} style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: "#F59E0B", color: "#111827", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + Add Book
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
            {[
              { label: "To Read",  value: stats.toRead,   color: "#FCD34D" },
              { label: "Reading",  value: stats.reading,  color: "#93C5FD" },
              { label: "Finished", value: stats.finished, color: "#86EFAC" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or author..."
            style={{ flex: 1, minWidth: 180, padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", color: "#111827" }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#374151", background: "#fff" }}>
            <option value="All">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {usedGenres.length > 0 && (
            <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#374151", background: "#fff" }}>
              <option value="All">All genres</option>
              {usedGenres.map(g => <option key={g}>{g}</option>)}
            </select>
          )}
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#374151", background: "#fff" }}>
            <option value="recent">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="author">Author A–Z</option>
            <option value="rating">Highest rated</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px 48px" }}>
        {loading && <p style={{ color: "#9CA3AF", textAlign: "center", padding: "60px 0" }}>Loading books...</p>}
        {error && (
          <div style={{ background: "#FFF5F5", border: "1px solid #FCA5A5", borderRadius: 12, padding: "20px 24px", color: "#DC2626", fontSize: 14, lineHeight: 1.6 }}>
            <strong>Connection error</strong><br />{error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#374151" }}>{books.length === 0 ? "Your shelf is empty" : "No books match your filters"}</p>
            <p style={{ fontSize: 14, marginTop: 6 }}>{books.length === 0 ? "Add your first book to get started" : "Try adjusting your search or filters"}</p>
            {books.length === 0 && (
              <button onClick={() => setModal({})} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Add your first book</button>
            )}
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>{filtered.length} book{filtered.length !== 1 ? "s" : ""}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filtered.map(book => <BookCard key={book.id} book={book} onEdit={b => setModal(b)} onDelete={deleteBook} />)}
            </div>
          </>
        )}
      </div>

      {modal !== null && (
        <Modal book={Object.keys(modal).length ? modal : null} onClose={() => setModal(null)} onSave={saveBook} saving={saving} />
      )}
    </div>
  );
}
