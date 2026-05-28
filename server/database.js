const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      imo TEXT UNIQUE,
      flag TEXT,
      type TEXT,
      gross_tonnage REAL,
      owner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS berth_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_id INTEGER NOT NULL,
      ship_name TEXT NOT NULL,
      arrival_date DATETIME NOT NULL,
      departure_date DATETIME,
      berth_number TEXT,
      status TEXT DEFAULT 'pending',
      purpose TEXT,
      agent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ship_id) REFERENCES ships(id),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      berth_plan_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      requested_by INTEGER,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (berth_plan_id) REFERENCES berth_plans(id),
      FOREIGN KEY (requested_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS crew_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      berth_plan_id INTEGER NOT NULL,
      service_id INTEGER,
      type TEXT NOT NULL,
      crew_name TEXT NOT NULL,
      rank TEXT,
      nationality TEXT,
      status TEXT DEFAULT 'pending',
      documents_status TEXT DEFAULT 'pending',
      arrival_flight TEXT,
      departure_flight TEXT,
      visa_expiry DATETIME,
      notes TEXT,
      FOREIGN KEY (berth_plan_id) REFERENCES berth_plans(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      berth_plan_id INTEGER NOT NULL,
      service_id INTEGER,
      category TEXT NOT NULL,
      items TEXT NOT NULL,
      supplier_id INTEGER,
      estimated_cost REAL,
      status TEXT DEFAULT 'pending',
      delivery_date DATETIME,
      notes TEXT,
      FOREIGN KEY (berth_plan_id) REFERENCES berth_plans(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    `);

    db.run(`CREATE TABLE IF NOT EXISTS advance_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      berth_plan_id INTEGER NOT NULL,
      service_id INTEGER,
      invoice_number TEXT UNIQUE,
      supplier TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      description TEXT,
      paid_date DATETIME,
      due_date DATETIME,
      status TEXT DEFAULT 'pending',
      paid_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (berth_plan_id) REFERENCES berth_plans(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (paid_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advance_payment_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      received_date DATETIME,
      status TEXT DEFAULT 'pending',
      payer TEXT,
      payment_method TEXT,
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advance_payment_id) REFERENCES advance_payments(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      expiry_date DATETIME,
      status TEXT DEFAULT 'valid',
      file_path TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      from_user INTEGER,
      to_user INTEGER,
      subject TEXT,
      content TEXT NOT NULL,
      direction TEXT DEFAULT 'internal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user) REFERENCES users(id),
      FOREIGN KEY (to_user) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      related_type TEXT,
      related_id INTEGER,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_berth_date ON berth_plans(arrival_date)
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_alert_user ON alerts(user_id, status)
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_doc_expiry ON documents(expiry_date)
    `);
  });
}

module.exports = db;
