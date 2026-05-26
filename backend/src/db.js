const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const config = require('./config')

const dbDir = path.dirname(config.dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      store_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS lens_sku (
      id TEXT PRIMARY KEY,
      sku_code TEXT UNIQUE NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      sphere_range TEXT,
      cylinder_range TEXT,
      add_power_range TEXT,
      description TEXT,
      stock INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      gender TEXT,
      age INTEGER,
      store_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_no TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      optician_id TEXT,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'normal',
      notes TEXT,
      source TEXT DEFAULT 'system',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (optician_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS optometry_records (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      optician_id TEXT NOT NULL,
      sphere_od REAL,
      sphere_os REAL,
      cylinder_od REAL,
      cylinder_os REAL,
      axis_od INTEGER,
      axis_os INTEGER,
      pd REAL,
      add_power REAL,
      ipd REAL,
      va_od TEXT,
      va_os TEXT,
      va_od_ph TEXT,
      va_os_ph TEXT,
      frame_brand TEXT,
      frame_model TEXT,
      frame_color TEXT,
      lens_sku_id TEXT,
      lens_brand TEXT,
      lens_model TEXT,
      coating TEXT,
      prescriptions TEXT,
      diagnosis TEXT,
      remarks TEXT,
      exam_date TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (optician_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      appointment_id TEXT,
      optometry_record_id TEXT,
      customer_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      optician_id TEXT,
      processor_id TEXT,
      frame_brand TEXT,
      frame_model TEXT,
      frame_color TEXT,
      frame_price REAL DEFAULT 0,
      lens_sku_id TEXT,
      lens_brand TEXT,
      lens_model TEXT,
      lens_type TEXT,
      lens_coating TEXT,
      lens_price REAL DEFAULT 0,
      sphere_od REAL,
      sphere_os REAL,
      cylinder_od REAL,
      cylinder_os REAL,
      axis_od INTEGER,
      axis_os INTEGER,
      pd REAL,
      add_power REAL,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'normal',
      expected_date TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (optometry_record_id) REFERENCES optometry_records(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (optician_id) REFERENCES users(id),
      FOREIGN KEY (processor_id) REFERENCES users(id),
      FOREIGN KEY (lens_sku_id) REFERENCES lens_sku(id)
    );

    CREATE TABLE IF NOT EXISTS lens_allocations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      lens_sku_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      from_store_id TEXT,
      to_store_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      allocated_by TEXT,
      allocated_at TEXT,
      received_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (lens_sku_id) REFERENCES lens_sku(id),
      FOREIGN KEY (from_store_id) REFERENCES stores(id),
      FOREIGN KEY (to_store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS processing_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      processor_id TEXT,
      processing_type TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      quality_check_by TEXT,
      quality_check_result TEXT,
      quality_check_notes TEXT,
      defects TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (processor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reworks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      processing_record_id TEXT,
      reason TEXT NOT NULL,
      rework_type TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_by TEXT,
      approved_by TEXT,
      requested_at TEXT DEFAULT (datetime('now')),
      approved_at TEXT,
      completed_at TEXT,
      source TEXT,
      remarks TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (processing_record_id) REFERENCES processing_records(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      rework_id TEXT,
      reason TEXT NOT NULL,
      amount REAL NOT NULL,
      refund_method TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_by TEXT,
      approved_by TEXT,
      requested_at TEXT DEFAULT (datetime('now')),
      approved_at TEXT,
      completed_at TEXT,
      remarks TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rework_id) REFERENCES reworks(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by TEXT,
      reason TEXT,
      changed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_store_date ON appointments(store_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_optician ON appointments(optician_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_processor ON orders(processor_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_reworks_order ON reworks(order_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
    CREATE INDEX IF NOT EXISTS idx_allocations_order ON lens_allocations(order_id);
    CREATE INDEX IF NOT EXISTS idx_allocations_status ON lens_allocations(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `)
}

module.exports = { db, initSchema }
