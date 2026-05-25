const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'data.db'))
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  fruit TEXT NOT NULL,
  variety TEXT,
  origin TEXT,
  supplier TEXT,
  received_at TEXT NOT NULL,
  gross_kg REAL NOT NULL,
  tare_kg REAL DEFAULT 0,
  net_kg REAL NOT NULL,
  unit_price REAL NOT NULL,
  grade_rule TEXT,
  warehouse TEXT,
  status TEXT DEFAULT 'received',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  qty_kg REAL NOT NULL,
  at TEXT NOT NULL,
  operator TEXT,
  note TEXT,
  ref TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

CREATE TABLE IF NOT EXISTS grading (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  graded_at TEXT NOT NULL,
  grade TEXT NOT NULL,
  qty_kg REAL NOT NULL,
  operator TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

CREATE TABLE IF NOT EXISTS picking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER,
  customer TEXT NOT NULL,
  order_no TEXT,
  picked_at TEXT NOT NULL,
  qty_kg REAL NOT NULL,
  grade TEXT,
  driver TEXT,
  status TEXT DEFAULT 'picked',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer TEXT NOT NULL,
  picking_id INTEGER,
  amount REAL NOT NULL,
  issued_at TEXT NOT NULL,
  due_at TEXT,
  settled_at TEXT,
  status TEXT DEFAULT 'open',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  paid_at TEXT NOT NULL,
  method TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer TEXT NOT NULL,
  picking_id INTEGER,
  reported_at TEXT NOT NULL,
  reason TEXT,
  qty_kg REAL,
  amount REAL,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS losses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  found_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  qty_kg REAL NOT NULL,
  cause TEXT,
  amount REAL,
  reviewed_by TEXT,
  status TEXT DEFAULT 'reported',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  role TEXT,
  phone TEXT
);
`)

module.exports = db
