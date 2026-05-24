import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function initDB() {
  const dbPath = process.env.DB_PATH || './data/database.db';
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function getDB() {
  if (!db) {
    return initDB();
  }
  return db;
}

export default { initDB, getDB };
