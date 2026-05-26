const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'coop.db');

function openDB() {
  return new Database(DB_PATH);
}

function migrate() {
  const db = openDB();
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('director','dispatcher','operator'))
    );

    CREATE TABLE IF NOT EXISTS subsidy_applications (
      id INTEGER PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      farmer_name TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_area REAL NOT NULL,
      crop_type TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted'
        CHECK(status IN ('submitted','scheduled','in_progress','completed','rejected','archived')),
      submitted_by INTEGER NOT NULL,
      submitted_at TEXT NOT NULL,
      scheduled_for TEXT,
      scheduled_operator_id INTEGER,
      note TEXT,
      FOREIGN KEY(submitted_by) REFERENCES users(id),
      FOREIGN KEY(scheduled_operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_reports (
      id INTEGER PRIMARY KEY,
      application_id INTEGER NOT NULL,
      operator_id INTEGER NOT NULL,
      reported_at TEXT NOT NULL,
      progress_pct INTEGER NOT NULL DEFAULT 0,
      area_done REAL NOT NULL DEFAULT 0,
      issue_type TEXT,
      issue_note TEXT,
      FOREIGN KEY(application_id) REFERENCES subsidy_applications(id),
      FOREIGN KEY(operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id INTEGER PRIMARY KEY,
      application_id INTEGER,
      operator_id INTEGER NOT NULL,
      vehicle_no TEXT,
      liters REAL NOT NULL,
      cost REAL NOT NULL,
      recorded_at TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(application_id) REFERENCES subsidy_applications(id),
      FOREIGN KEY(operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS review_flags (
      id INTEGER PRIMARY KEY,
      application_id INTEGER NOT NULL,
      flag_type TEXT NOT NULL
        CHECK(flag_type IN ('late_progress','missing_doc','maintenance','revisit')),
      severity TEXT NOT NULL DEFAULT 'normal' CHECK(severity IN ('low','normal','high')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
      created_by INTEGER,
      created_at TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(application_id) REFERENCES subsidy_applications(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subsidy_materials (
      id INTEGER PRIMARY KEY,
      application_id INTEGER NOT NULL,
      material_type TEXT NOT NULL,
      collected INTEGER NOT NULL DEFAULT 0,
      collected_at TEXT,
      note TEXT,
      FOREIGN KEY(application_id) REFERENCES subsidy_applications(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  db.close();
}

module.exports = { openDB, migrate, DB_PATH };
