import 'dotenv/config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || './data/database.db';
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('supervisor', 'manager', 'service', 'admin')),
    phone TEXT,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    project_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    supervisor_id TEXT REFERENCES users(id),
    manager_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'ongoing' CHECK(status IN ('pending', 'ongoing', 'completed', 'suspended')),
    start_date TEXT,
    expected_end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    complaint_no TEXT UNIQUE NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('quality', 'schedule', 'cost', 'service', 'other')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'processing', 'verified', 'completed', 'closed')),
    reporter_id TEXT REFERENCES users(id),
    handler_id TEXT REFERENCES users(id),
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaint_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT REFERENCES users(id),
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS complaint_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    content TEXT NOT NULL,
    attachments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    planned_date TEXT,
    actual_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'delayed')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES milestones(id) ON DELETE CASCADE,
    complaint_id TEXT REFERENCES complaints(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('milestone', 'complaint', 'deadline', 'custom')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    remind_at TEXT NOT NULL,
    is_sent INTEGER DEFAULT 0,
    recipient_id TEXT NOT NULL REFERENCES users(id),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS confirmations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('milestone', 'complaint', 'cost', 'change')),
    ref_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected')),
    version INTEGER DEFAULT 1,
    confirmer_id TEXT REFERENCES users(id),
    confirmed_at TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    ref_id TEXT,
    user_id TEXT REFERENCES users(id),
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_complaints_project ON complaints(project_id);
  CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
  CREATE INDEX IF NOT EXISTS idx_complaints_handler ON complaints(handler_id);
  CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
  CREATE INDEX IF NOT EXISTS idx_reminders_recipient ON reminders(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_audit_ref ON audit_logs(module, ref_id);
  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
`);

console.log('数据库初始化完成');
db.close();
