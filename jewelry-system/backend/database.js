const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'jewelry.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('store_manager', 'sales_associate', 'after_sales')),
      store_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      material TEXT,
      weight REAL,
      cost_price REAL NOT NULL,
      retail_price REAL NOT NULL,
      status TEXT DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'allocated', 'sold', 'transferred', 'repairing', 'lost')),
      current_store_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_requests (
      id TEXT PRIMARY KEY,
      request_no TEXT UNIQUE NOT NULL,
      from_store_id TEXT NOT NULL,
      to_store_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      reason TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'shipped', 'received', 'completed', 'cancelled')),
      approved_by TEXT,
      approved_at DATETIME,
      rejection_reason TEXT,
      shipped_by TEXT,
      shipped_at DATETIME,
      received_by TEXT,
      received_at DATETIME,
      completed_by TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_store_id) REFERENCES stores(id),
      FOREIGN KEY (to_store_id) REFERENCES stores(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (shipped_by) REFERENCES users(id),
      FOREIGN KEY (received_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_checks (
      id TEXT PRIMARY KEY,
      check_no TEXT UNIQUE NOT NULL,
      store_id TEXT NOT NULL,
      check_date DATE NOT NULL,
      checked_by TEXT NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'reviewing', 'confirmed', 'resolved')),
      total_expected INTEGER DEFAULT 0,
      total_actual INTEGER DEFAULT 0,
      total_difference INTEGER DEFAULT 0,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (checked_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      inventory_check_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      expected_quantity INTEGER DEFAULT 1,
      actual_quantity INTEGER DEFAULT 1,
      difference INTEGER DEFAULT 0,
      difference_type TEXT CHECK(difference_type IN ('surplus', 'shortage', 'none')),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_check_id) REFERENCES inventory_checks(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS difference_dispositions (
      id TEXT PRIMARY KEY,
      inventory_item_id TEXT NOT NULL,
      disposition_type TEXT NOT NULL CHECK(disposition_type IN ('transfer_related', 'sale_unrecorded', 'loss', 'damage', 'found', 'other')),
      related_transfer_id TEXT,
      responsible_person TEXT,
      responsibility_confirmed BOOLEAN DEFAULT 0,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      compensation_amount REAL DEFAULT 0,
      compensation_status TEXT DEFAULT 'pending' CHECK(compensation_status IN ('pending', 'paid', 'waived', 'in_progress')),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (related_transfer_id) REFERENCES transfer_requests(id),
      FOREIGN KEY (responsible_person) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS repair_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      product_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      repair_type TEXT NOT NULL CHECK(repair_type IN ('resize', 'polish', 'repair', 'remake', 'modify')),
      description TEXT NOT NULL,
      before_photos TEXT,
      after_photos TEXT,
      agreed_price REAL DEFAULT 0,
      status TEXT DEFAULT 'received' CHECK(status IN ('received', 'in_progress', 'completed', 'picked_up', 'cancelled')),
      received_by TEXT NOT NULL,
      picked_up_by TEXT,
      picked_up_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (received_by) REFERENCES users(id),
      FOREIGN KEY (picked_up_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      ref_type TEXT NOT NULL CHECK(ref_type IN ('transfer', 'inventory', 'repair', 'product', 'disposition')),
      ref_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      remarks TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transfer_status ON transfer_requests(status);
    CREATE INDEX IF NOT EXISTS idx_transfer_product ON transfer_requests(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory_checks(store_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_checks(status);
    CREATE INDEX IF NOT EXISTS idx_logs_ref ON operation_logs(ref_type, ref_id);
  `);

  console.log('Database tables initialized');
}

function initSampleData() {
  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
  if (storeCount > 0) {
    console.log('Sample data already exists, skipping initialization');
    return;
  }

  const stores = [
    { id: 'store_001', name: '北京王府井店', address: '北京市东城区王府井大街138号' },
    { id: 'store_002', name: '上海南京东路店', address: '上海市黄浦区南京东路300号' },
    { id: 'store_003', name: '深圳万象城店', address: '深圳市罗湖区宝安南路1881号' }
  ];

  const insertStore = db.prepare('INSERT INTO stores (id, name, address) VALUES (?, ?, ?)');
  stores.forEach(store => insertStore.run(store.id, store.name, store.address));

  const users = [
    { id: 'user_sm_001', username: 'bj_manager', password: '123456', name: '张店长', role: 'store_manager', store_id: 'store_001' },
    { id: 'user_sa_001', username: 'bj_sales1', password: '123456', name: '李导购', role: 'sales_associate', store_id: 'store_001' },
    { id: 'user_sa_002', username: 'bj_sales2', password: '123456', name: '王导购', role: 'sales_associate', store_id: 'store_001' },
    { id: 'user_as_001', username: 'bj_aftersale', password: '123456', name: '赵售后', role: 'after_sales', store_id: 'store_001' },
    { id: 'user_sm_002', username: 'sh_manager', password: '123456', name: '陈店长', role: 'store_manager', store_id: 'store_002' },
    { id: 'user_sa_003', username: 'sh_sales1', password: '123456', name: '孙导购', role: 'sales_associate', store_id: 'store_002' }
  ];

  const insertUser = db.prepare('INSERT INTO users (id, username, password, name, role, store_id) VALUES (?, ?, ?, ?, ?, ?)');
  users.forEach(user => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    insertUser.run(user.id, user.username, hashedPassword, user.name, user.role, user.store_id);
  });

  const products = [
    { id: 'prod_001', sku: 'DIA-R-001', name: '经典六爪钻戒', category: '戒指', material: '18K白金', weight: 3.5, cost_price: 8000, retail_price: 15800, current_store_id: 'store_001' },
    { id: 'prod_002', sku: 'DIA-N-002', name: '永恒之心钻石项链', category: '项链', material: 'PT950', weight: 5.2, cost_price: 12000, retail_price: 23800, current_store_id: 'store_001' },
    { id: 'prod_003', sku: 'GOL-B-003', name: '传承系列金镯', category: '手镯', material: '足金999', weight: 35.8, cost_price: 18000, retail_price: 28800, current_store_id: 'store_001' },
    { id: 'prod_004', sku: 'DIA-E-004', name: '星光璀璨钻石耳环', category: '耳环', material: '18K玫瑰金', weight: 2.8, cost_price: 6500, retail_price: 12800, current_store_id: 'store_001' },
    { id: 'prod_005', sku: 'DIA-R-005', name: '豪华群镶钻戒', category: '戒指', material: 'PT950', weight: 4.2, cost_price: 25000, retail_price: 49800, current_store_id: 'store_002' },
    { id: 'prod_006', sku: 'GOL-P-006', name: '龙凤呈祥吊坠', category: '吊坠', material: '足金999', weight: 12.5, cost_price: 6000, retail_price: 9800, current_store_id: 'store_002' },
    { id: 'prod_007', sku: 'DIA-R-007', name: '简约四爪钻戒', category: '戒指', material: '18K白金', weight: 3.0, cost_price: 6000, retail_price: 11800, current_store_id: 'store_001' },
    { id: 'prod_008', sku: 'DIA-N-008', name: '水滴形钻石吊坠', category: '项链', material: '18K白金', weight: 2.5, cost_price: 8500, retail_price: 16800, current_store_id: 'store_003' }
  ];

  const insertProduct = db.prepare('INSERT INTO products (id, sku, name, category, material, weight, cost_price, retail_price, current_store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  products.forEach(p => insertProduct.run(p.id, p.sku, p.name, p.category, p.material, p.weight, p.cost_price, p.retail_price, p.current_store_id));

  console.log('Sample data initialized');
}

module.exports = { db, initDatabase, initSampleData };
