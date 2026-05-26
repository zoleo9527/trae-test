const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      spec TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT '盒',
      base_price DECIMAL(10,2) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      manager_id INTEGER,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      available_quantity INTEGER NOT NULL DEFAULT 0,
      unit_price DECIMAL(10,2) NOT NULL,
      production_date DATE,
      expiry_date DATE,
      supplier TEXT,
      inbound_no TEXT,
      inbound_date DATE,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS stock_take_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_no TEXT UNIQUE NOT NULL,
      warehouse_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      planned_date DATE NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      creator_id INTEGER NOT NULL,
      executor_id INTEGER,
      reviewer_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (executor_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_take_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      batch_id INTEGER,
      system_quantity INTEGER NOT NULL DEFAULT 0,
      actual_quantity INTEGER,
      difference INTEGER,
      unit_price DECIMAL(10,2),
      difference_amount DECIMAL(12,2),
      check_result TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES stock_take_plans(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
    );

    CREATE TABLE IF NOT EXISTS loss_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      warehouse_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      loss_type TEXT NOT NULL,
      loss_reason TEXT,
      total_quantity INTEGER NOT NULL DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      reporter_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      approver_id INTEGER,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      approved_at DATETIME,
      related_stock_take_id INTEGER,
      remark TEXT,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id),
      FOREIGN KEY (related_stock_take_id) REFERENCES stock_take_plans(id)
    );

    CREATE TABLE IF NOT EXISTS loss_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      batch_id INTEGER,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      responsibility TEXT,
      responsible_person_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES loss_reports(id),
      FOREIGN KEY (batch_id) REFERENCES inventory_batches(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (responsible_person_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      operation TEXT NOT NULL,
      record_id INTEGER,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      content TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      adjust_type TEXT NOT NULL,
      price_type TEXT NOT NULL,
      old_price DECIMAL(10,2) NOT NULL,
      new_price DECIMAL(10,2) NOT NULL,
      effective_date DATE NOT NULL,
      expiry_date DATE,
      reason TEXT,
      approver_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_out_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      out_no TEXT UNIQUE NOT NULL,
      warehouse_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      target_warehouse_id INTEGER,
      customer_name TEXT,
      total_quantity INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      creator_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      out_time DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (target_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_out_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      out_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      remark TEXT,
      FOREIGN KEY (out_id) REFERENCES stock_out_records(id),
      FOREIGN KEY (batch_id) REFERENCES inventory_batches(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_batch_product ON inventory_batches(product_id);
    CREATE INDEX IF NOT EXISTS idx_batch_warehouse ON inventory_batches(warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_take_warehouse ON stock_take_plans(warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_take_status ON stock_take_plans(status);
    CREATE INDEX IF NOT EXISTS idx_loss_warehouse ON loss_reports(warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_loss_status ON loss_reports(status);
    CREATE INDEX IF NOT EXISTS idx_log_module ON operation_logs(module);
    CREATE INDEX IF NOT EXISTS idx_log_record ON operation_logs(module, record_id);
  `);
}

module.exports = { db, initDatabase };
