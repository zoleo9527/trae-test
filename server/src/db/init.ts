import db from './index';

export function initDatabase() {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'coach', 'reception')),
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    -- 会员表
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      member_type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (member_type IN ('normal', 'silver', 'gold', 'diamond')),
      birthday DATE,
      remark TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 储值账户表
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER UNIQUE NOT NULL REFERENCES members(id),
      principal_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      gift_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      frozen_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 储值流水表
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'consume', 'refund', 'adjust')),
      amount DECIMAL(10,2) NOT NULL,
      principal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      gift_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      source VARCHAR(30) NOT NULL,
      source_id INTEGER,
      operator_id INTEGER NOT NULL REFERENCES users(id),
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'matched', 'mismatched', 'adjusted')),
      reconciliation_id INTEGER REFERENCES reconciliations(id)
    );

    -- 球道表
    CREATE TABLE IF NOT EXISTS bays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      bay_number INTEGER UNIQUE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'closed')),
      type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'vip', 'coach')),
      hourly_rate DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 预约表
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER REFERENCES members(id),
      bay_id INTEGER NOT NULL REFERENCES bays(id),
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      duration_minutes INTEGER NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'completed', 'cancelled', 'no_show')),
      checkin_operator_id INTEGER REFERENCES users(id),
      checkin_at DATETIME,
      complete_operator_id INTEGER REFERENCES users(id),
      completed_at DATETIME,
      created_by INTEGER NOT NULL REFERENCES users(id),
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 器材表
    CREATE TABLE IF NOT EXISTS equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      brand VARCHAR(50),
      specification VARCHAR(100),
      total_quantity INTEGER NOT NULL DEFAULT 0,
      available_quantity INTEGER NOT NULL DEFAULT 0,
      deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 器材借还记录表
    CREATE TABLE IF NOT EXISTS equipment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL REFERENCES equipments(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      booking_id INTEGER REFERENCES bookings(id),
      borrow_operator_id INTEGER NOT NULL REFERENCES users(id),
      borrow_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      return_operator_id INTEGER REFERENCES users(id),
      return_at DATETIME,
      return_status VARCHAR(20) CHECK (return_status IN ('normal', 'damaged', 'lost')),
      damage_remark TEXT,
      damage_fee DECIMAL(10,2) DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 对账单表
    CREATE TABLE IF NOT EXISTS reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reconciliation_date DATE UNIQUE NOT NULL,
      total_recharge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total_consume DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      difference DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'adjusted')),
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 异常工单表
    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER REFERENCES members(id),
      type VARCHAR(30) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      evidence_screenshot TEXT,
      related_transaction_id INTEGER REFERENCES wallet_transactions(id),
      related_booking_id INTEGER REFERENCES bookings(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
      created_by INTEGER NOT NULL REFERENCES users(id),
      handled_by INTEGER REFERENCES users(id),
      handled_at DATETIME,
      handling_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 操作日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      module VARCHAR(50) NOT NULL,
      action VARCHAR(20) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id INTEGER NOT NULL,
      old_value TEXT,
      new_value TEXT,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 系统配置表
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key VARCHAR(100) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      updated_by INTEGER REFERENCES users(id),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 节假日表
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holiday_date DATE UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'special')),
      coefficient DECIMAL(3,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_member_phone ON members(phone);
    CREATE INDEX IF NOT EXISTS idx_transaction_member ON wallet_transactions(member_id);
    CREATE INDEX IF NOT EXISTS idx_transaction_created ON wallet_transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_booking_date ON bookings(booking_date);
    CREATE INDEX IF NOT EXISTS idx_booking_member ON bookings(member_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_record_member ON equipment_records(member_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_holiday_date ON holidays(holiday_date);
  `);

  console.log('数据库初始化完成');

  console.log('开始回填节假日数据（幂等 INSERT OR IGNORE）...');
  const insertHoliday = db.prepare(`
    INSERT OR IGNORE INTO holidays (holiday_date, name, type, coefficient)
    VALUES (?, ?, ?, ?)
  `);

  const holidays = [
    ['2026-01-01', '元旦', 'public', 1.5],
    ['2026-01-29', '春节', 'public', 1.5],
    ['2026-01-30', '春节', 'public', 1.5],
    ['2026-01-31', '春节', 'public', 1.5],
    ['2026-02-01', '春节', 'public', 1.5],
    ['2026-02-02', '春节', 'public', 1.5],
    ['2026-02-03', '春节', 'public', 1.5],
    ['2026-04-04', '清明节', 'public', 1.5],
    ['2026-04-05', '清明节', 'public', 1.5],
    ['2026-05-01', '劳动节', 'public', 1.5],
    ['2026-05-02', '劳动节', 'public', 1.5],
    ['2026-05-03', '劳动节', 'public', 1.5],
    ['2026-05-30', '端午节', 'public', 1.5],
    ['2026-05-31', '端午节', 'public', 1.5],
    ['2026-10-01', '国庆节', 'public', 1.5],
    ['2026-10-02', '国庆节', 'public', 1.5],
    ['2026-10-03', '国庆节', 'public', 1.5],
    ['2026-10-04', '国庆节', 'public', 1.5],
    ['2026-10-05', '国庆节', 'public', 1.5],
    ['2026-10-06', '国庆节', 'public', 1.5],
    ['2026-10-07', '国庆节', 'public', 1.5],
    ['2026-06-19', '场地维护日', 'special', 2.0]
  ];

  let inserted = 0;
  holidays.forEach(h => {
    const result = insertHoliday.run(h[0], h[1], h[2], h[3]);
    if (result.changes > 0) inserted++;
  });

  const holidayCount = db.prepare('SELECT COUNT(*) as count FROM holidays').get() as { count: number };
  console.log(`✅ 节假日数据处理完成：新增 ${inserted} 条，总计 ${holidayCount.count} 条`);
}
