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
    CREATE TABLE IF NOT EXISTS film_rolls (
      id TEXT PRIMARY KEY,
      roll_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_contact TEXT NOT NULL DEFAULT '',
      film_type TEXT NOT NULL,
      scan_spec TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'registered' CHECK(status IN (
        'registered', 'developing', 'qc_pending', 'qc_passed', 'qc_failed',
        'reworking', 'recheck', 'confirming', 'compensating', 'completed'
      )),
      registered_at TEXT NOT NULL,
      due_date TEXT,
      assignee_id TEXT,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_role TEXT NOT NULL CHECK(operator_role IN ('owner', 'developer', 'cs')),
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_actions_roll_id ON actions(roll_id);
    CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at);

    CREATE TABLE IF NOT EXISTS qc_records (
      id TEXT PRIMARY KEY,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      result TEXT NOT NULL CHECK(result IN ('pass', 'fail')),
      issue_desc TEXT NOT NULL DEFAULT '',
      impact_scope TEXT NOT NULL DEFAULT '',
      operator_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rework_decisions (
      id TEXT PRIMARY KEY,
      qc_id TEXT NOT NULL REFERENCES qc_records(id) ON DELETE CASCADE,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      decision TEXT NOT NULL CHECK(decision IN ('rework', 'compensate', 'pass')),
      reason TEXT NOT NULL DEFAULT '',
      decided_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rework_executions (
      id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL REFERENCES rework_decisions(id) ON DELETE CASCADE,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      action_detail TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL CHECK(result IN ('completed', 'failed')),
      operator_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recheck_records (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL REFERENCES rework_executions(id) ON DELETE CASCADE,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      result TEXT NOT NULL CHECK(result IN ('pass', 'fail')),
      note TEXT NOT NULL DEFAULT '',
      checked_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS confirm_requests (
      id TEXT PRIMARY KEY,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      delivery_desc TEXT NOT NULL DEFAULT '',
      operator_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS confirm_results (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES confirm_requests(id) ON DELETE CASCADE,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      result TEXT NOT NULL CHECK(result IN ('satisfied', 'dissatisfied', 'compensation')),
      feedback TEXT NOT NULL DEFAULT '',
      operator_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS compensation_records (
      id TEXT PRIMARY KEY,
      confirm_result_id TEXT NOT NULL REFERENCES confirm_results(id) ON DELETE CASCADE,
      roll_id TEXT NOT NULL REFERENCES film_rolls(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('refund', 'discount', 'credit', 'other')),
      reason TEXT NOT NULL DEFAULT '',
      approved_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  return db
}

export function clearDatabase(): void {
  if (!db) return
  
  const tables = [
    'compensation_records',
    'confirm_results',
    'confirm_requests',
    'recheck_records',
    'rework_executions',
    'rework_decisions',
    'qc_records',
    'actions',
    'film_rolls'
  ]

  db.exec('PRAGMA foreign_keys = OFF')
  tables.forEach(table => {
    db?.exec(`DELETE FROM ${table}`)
  })
  db.exec('PRAGMA foreign_keys = ON')
}
