import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'film-lab.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): Database.Database {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('店主', '冲印师', '客服')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS film_rolls (
      id TEXT PRIMARY KEY,
      roll_no TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('135', '120', '4x5', '其他')),
      customer_name TEXT NOT NULL,
      customer_contact TEXT NOT NULL,
      process_type TEXT NOT NULL CHECK(process_type IN ('C-41', 'E-6', 'BW', 'ECN-2')),
      scan_resolution TEXT NOT NULL CHECK(scan_resolution IN ('标准', '高清', '超清')),
      status TEXT NOT NULL DEFAULT '待冲印' CHECK(status IN ('待冲印','冲印中','待扫描','扫描中','待质检','已质检','待交付','已交付')),
      assigned_processor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id TEXT PRIMARY KEY,
      film_id TEXT NOT NULL REFERENCES film_rolls(id),
      action_type TEXT NOT NULL,
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL CHECK(operator_role IN ('店主', '冲印师', '客服')),
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_action_logs_film_id ON action_logs(film_id);
    CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at);

    CREATE TABLE IF NOT EXISTS rework_orders (
      id TEXT PRIMARY KEY,
      film_id TEXT NOT NULL REFERENCES film_rolls(id),
      issue_type TEXT NOT NULL CHECK(issue_type IN ('混号', '划痕', '色偏', '漏冲', '扫描瑕疵', '其他')),
      description TEXT NOT NULL DEFAULT '',
      photo_urls TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT '待处理' CHECK(status IN ('待处理','店主已审批','处理中','待复核','已闭环')),
      decided_by TEXT,
      decision TEXT CHECK(decision IN ('返工', '赔付')),
      assigned_to TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_rework_orders_film_id ON rework_orders(film_id);
    CREATE INDEX IF NOT EXISTS idx_rework_orders_status ON rework_orders(status);

    CREATE TABLE IF NOT EXISTS rework_logs (
      id TEXT PRIMARY KEY,
      rework_id TEXT NOT NULL REFERENCES rework_orders(id),
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL CHECK(operator_role IN ('店主', '冲印师', '客服')),
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rework_logs_rework_id ON rework_logs(rework_id);

    CREATE TABLE IF NOT EXISTS customer_confirmations (
      id TEXT PRIMARY KEY,
      film_id TEXT NOT NULL REFERENCES film_rolls(id),
      delivery_version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待确认' CHECK(status IN ('待确认','已确认','不满意','需返工','需赔付')),
      customer_feedback TEXT,
      compensation_amount REAL,
      compensation_reason TEXT,
      confirmed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_customer_confirmations_film_id ON customer_confirmations(film_id);
    CREATE INDEX IF NOT EXISTS idx_customer_confirmations_status ON customer_confirmations(status);
  `)

  return db
}
