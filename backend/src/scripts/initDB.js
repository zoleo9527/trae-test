const { run } = require('../config/database');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function initDB() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_no TEXT UNIQUE NOT NULL,
      version INTEGER DEFAULT 1,
      customer_name TEXT NOT NULL,
      customer_contact TEXT,
      project_name TEXT NOT NULL,
      product_type TEXT,
      quantity INTEGER,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(10,2),
      delivery_date DATE,
      status TEXT DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      current_handler INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS quote_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER REFERENCES quotes(id),
      version INTEGER NOT NULL,
      customer_name TEXT,
      project_name TEXT,
      quantity INTEGER,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(10,2),
      delivery_date DATE,
      modified_by INTEGER REFERENCES users(id),
      modify_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(quote_id, version)
    )`,
    `CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER REFERENCES quotes(id),
      approval_type TEXT NOT NULL,
      approver_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      comments TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER REFERENCES quotes(id),
      proof_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      assigned_to INTEGER REFERENCES users(id),
      proof_images TEXT,
      customer_feedback TEXT,
      confirmed_by INTEGER REFERENCES users(id),
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER REFERENCES quotes(id),
      shipment_no TEXT UNIQUE NOT NULL,
      parent_shipment_id INTEGER REFERENCES shipments(id),
      status TEXT DEFAULT 'pending',
      total_quantity INTEGER,
      shipped_quantity INTEGER DEFAULT 0,
      warehouse TEXT,
      logistics_company TEXT,
      tracking_no TEXT,
      checked_by INTEGER REFERENCES users(id),
      shipped_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shipment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER REFERENCES shipments(id),
      product_name TEXT,
      quantity INTEGER,
      batch_no TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER REFERENCES quotes(id),
      refund_no TEXT UNIQUE NOT NULL,
      amount DECIMAL(10,2),
      reason TEXT,
      status TEXT DEFAULT 'pending',
      applicant_id INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER REFERENCES quotes(id),
      action_type TEXT NOT NULL,
      action_detail TEXT,
      operator_id INTEGER REFERENCES users(id),
      operator_name TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`,
    `CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_name)`,
    `CREATE INDEX IF NOT EXISTS idx_approvals_quote ON approvals(quote_id)`,
    `CREATE INDEX IF NOT EXISTS idx_proofs_quote ON proofs(quote_id)`,
    `CREATE INDEX IF NOT EXISTS idx_shipments_quote ON shipments(quote_id)`,
    `CREATE INDEX IF NOT EXISTS idx_logs_quote ON activity_logs(quote_id)`
  ];

  for (const stmt of statements) {
    await run(stmt);
  }

  console.log('数据库初始化完成');
  process.exit(0);
}

initDB().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});
