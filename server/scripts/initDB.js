const db = require('../db');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

db.exec(`
  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    level TEXT DEFAULT 'potential',
    source TEXT,
    assigned_staff_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS tea_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    spec TEXT,
    unit_price REAL,
    stock_quantity INTEGER DEFAULT 0,
    warehouse TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trial_records (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    trial_quantity INTEGER NOT NULL,
    trial_date TEXT NOT NULL,
    assigned_staff_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    feedback TEXT,
    satisfaction_score INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES tea_products(id),
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS followup_tasks (
    id TEXT PRIMARY KEY,
    trial_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    assigned_staff_id TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT,
    followup_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    actual_date TEXT,
    content TEXT,
    result TEXT,
    next_followup_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trial_id) REFERENCES trial_records(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    discount_rate REAL DEFAULT 0,
    final_amount REAL NOT NULL,
    warehouse TEXT,
    delivery_address TEXT,
    status TEXT DEFAULT 'pending_approval',
    batch_no TEXT,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    approved_at TEXT,
    shipped_by TEXT,
    shipped_at TEXT,
    received_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES tea_products(id),
    FOREIGN KEY (created_by) REFERENCES staff(id),
    FOREIGN KEY (approved_by) REFERENCES staff(id),
    FOREIGN KEY (shipped_by) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS approval_records (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    approver_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (approver_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS exception_records (
    id TEXT PRIMARY KEY,
    related_type TEXT NOT NULL,
    related_id TEXT NOT NULL,
    exception_type TEXT NOT NULL,
    description TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    handled_by TEXT,
    handled_at TEXT,
    resolution TEXT,
    evidence_urls TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES staff(id),
    FOREIGN KEY (handled_by) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    operator_id TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS remarks (
    id TEXT PRIMARY KEY,
    related_type TEXT NOT NULL,
    related_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    is_supplement INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES staff(id)
  );

  CREATE INDEX IF NOT EXISTS idx_customers_staff ON customers(assigned_staff_id);
  CREATE INDEX IF NOT EXISTS idx_trials_customer ON trial_records(customer_id);
  CREATE INDEX IF NOT EXISTS idx_trials_staff ON trial_records(assigned_staff_id);
  CREATE INDEX IF NOT EXISTS idx_followups_trial ON followup_tasks(trial_id);
  CREATE INDEX IF NOT EXISTS idx_followups_staff ON followup_tasks(assigned_staff_id);
  CREATE INDEX IF NOT EXISTS idx_followups_date ON followup_tasks(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_approvals_order ON approval_records(order_id);
  CREATE INDEX IF NOT EXISTS idx_exceptions_related ON exception_records(related_type, related_id);
`);

console.log('数据库初始化完成');
