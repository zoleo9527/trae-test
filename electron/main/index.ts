import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Database from 'better-sqlite3'
import Store from 'electron-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let mainWindow: BrowserWindow | null = null
let db: Database.Database | null = null
const store = new Store()

function getDbPath() {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'laundry.db')
}

function initDatabase() {
  db = new Database(getDbPath())
  db.pragma('journal_mode = WAL')
  
  const addColumnIfNotExists = (table: string, column: string, definition: string) => {
    try {
      const stmt = db?.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
      stmt?.run()
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.log(`Migration for ${table}.${column} skipped:`, e.message)
      }
    }
  }
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('factory', 'inspector', 'store')),
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT UNIQUE NOT NULL,
      store_id INTEGER NOT NULL,
      store_name TEXT NOT NULL,
      total_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      received_by INTEGER,
      returned_at DATETIME,
      returned_by INTEGER,
      return_signature TEXT,
      FOREIGN KEY (store_id) REFERENCES users(id),
      FOREIGN KEY (received_by) REFERENCES users(id),
      FOREIGN KEY (returned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clothes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clothes_no TEXT UNIQUE NOT NULL,
      batch_id INTEGER,
      customer_name TEXT,
      customer_phone TEXT,
      category TEXT NOT NULL,
      brand TEXT,
      color TEXT,
      size TEXT,
      price REAL,
      services TEXT,
      status TEXT DEFAULT 'received',
      has_damage INTEGER DEFAULT 0,
      washing_finished_at DATETIME,
      returned_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS damage_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clothes_id INTEGER NOT NULL,
      damage_type TEXT NOT NULL,
      description TEXT,
      severity TEXT CHECK(severity IN ('minor', 'major', 'critical')),
      evidence_photos TEXT,
      reported_by INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      dispute_note TEXT,
      resolved_by INTEGER,
      resolved_at DATETIME,
      compensation_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clothes_id) REFERENCES clothes(id),
      FOREIGN KEY (reported_by) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clothes_id INTEGER,
      batch_id INTEGER,
      operation TEXT NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_name TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clothes_id) REFERENCES clothes(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS return_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_no TEXT UNIQUE NOT NULL,
      batch_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      store_name TEXT NOT NULL,
      total_count INTEGER DEFAULT 0,
      signed_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      sent_at DATETIME,
      sent_by INTEGER,
      signed_at DATETIME,
      signed_by INTEGER,
      signature TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (store_id) REFERENCES users(id),
      FOREIGN KEY (sent_by) REFERENCES users(id),
      FOREIGN KEY (signed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS return_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_order_id INTEGER NOT NULL,
      clothes_id INTEGER NOT NULL,
      clothes_no TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      signed_at DATETIME,
      signed_by INTEGER,
      damage_found INTEGER DEFAULT 0,
      damage_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (return_order_id) REFERENCES return_orders(id),
      FOREIGN KEY (clothes_id) REFERENCES clothes(id),
      FOREIGN KEY (signed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cache_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      cache_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );
  `)

  addColumnIfNotExists('batches', 'returned_at', 'DATETIME')
  addColumnIfNotExists('batches', 'returned_by', 'INTEGER')
  addColumnIfNotExists('batches', 'return_signature', 'TEXT')
  addColumnIfNotExists('clothes', 'washing_finished_at', 'DATETIME')
  addColumnIfNotExists('clothes', 'returned_at', 'DATETIME')
  addColumnIfNotExists('return_orders', 'signed_count', 'INTEGER DEFAULT 0')
  addColumnIfNotExists('return_orders', 'sent_at', 'DATETIME')
  addColumnIfNotExists('return_orders', 'sent_by', 'INTEGER')
  addColumnIfNotExists('return_orders', 'signed_at', 'DATETIME')
  addColumnIfNotExists('return_orders', 'signed_by', 'INTEGER')
  addColumnIfNotExists('return_orders', 'signature', 'TEXT')
  addColumnIfNotExists('return_orders', 'remark', 'TEXT')
  addColumnIfNotExists('return_order_items', 'damage_found', 'INTEGER DEFAULT 0')
  addColumnIfNotExists('return_order_items', 'damage_note', 'TEXT')
  addColumnIfNotExists('return_order_items', 'signed_at', 'DATETIME')
  addColumnIfNotExists('return_order_items', 'signed_by', 'INTEGER')
  addColumnIfNotExists('operation_logs', 'batch_id', 'INTEGER')
  addColumnIfNotExists('operation_logs', 'note', 'TEXT')

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)
    `)
    insertUser.run('factory', '123456', 'factory', '张厂长')
    insertUser.run('inspector', '123456', 'inspector', '李质检')
    insertUser.run('store', '123456', 'store', '门店小王')

    const insertBatch = db.prepare(`
      INSERT INTO batches (batch_no, store_id, store_name, total_count, status) VALUES (?, ?, ?, ?, ?)
    `)
    const batch1Id = insertBatch.run('B20240115001', 3, '朝阳门店', 12, 'processing').lastInsertRowid
    const batch2Id = insertBatch.run('B20240115002', 3, '海淀门店', 8, 'pending').lastInsertRowid
    const batch3Id = insertBatch.run('B20240114001', 3, '朝阳门店', 15, 'pending').lastInsertRowid

    const insertClothes = db.prepare(`
      INSERT INTO clothes (clothes_no, batch_id, customer_name, customer_phone, category, brand, color, size, price, services, status, has_damage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const clothesData = [
      ['C202401150001', batch1Id, '张三', '13800138001', '西装', 'Armani', '黑色', 'L', 128, '精洗+熨烫', 'washed', 0],
      ['C202401150002', batch1Id, '李四', '13800138002', '羽绒服', 'Moncler', '白色', 'M', 88, '干洗', 'washed', 0],
      ['C202401150003', batch1Id, '王五', '13800138003', '羊毛大衣', 'MaxMara', '驼色', 'S', 158, '精洗', 'damage_reported', 1],
      ['C202401150004', batch1Id, '赵六', '13800138004', '衬衫', 'Brooks', '白色', '42', 35, '水洗+熨烫', 'washing', 0],
      ['C202401150005', batch1Id, '钱七', '13800138005', 'T恤', 'Uniqlo', '灰色', 'L', 20, '水洗', 'washed', 0],
      ['C202401150006', batch1Id, '孙八', '13800138006', '牛仔裤', 'Levis', '蓝色', '32', 45, '水洗', 'damage_reported', 1],
      ['C202401150007', batch1Id, '周九', '13800138007', '毛衣', 'Gucci', '红色', 'M', 68, '干洗', 'sorted', 0],
      ['C202401150008', batch1Id, '吴十', '13800138008', '外套', 'Burberry', '卡其色', 'M', 98, '精洗', 'sorting', 0],
      ['C202401150009', batch1Id, '郑十一', '13800138009', '裙子', 'Dior', '黑色', 'S', 78, '干洗+熨烫', 'received', 0],
      ['C202401150010', batch1Id, '王十二', '13800138010', '西装', 'Boss', '深蓝', 'L', 128, '精洗+熨烫', 'received', 0],
      ['C202401150011', batch2Id, '冯十三', '13800138011', '羽绒服', 'Canada', '黑色', 'XL', 98, '干洗', 'return_to_store', 1],
      ['C202401150012', batch2Id, '陈十四', '13800138012', '衬衫', '雅戈尔', '白色', '41', 35, '水洗+熨烫', 'washed', 0],
      ['C202401150013', batch2Id, '褚十五', '13800138013', '羊毛大衣', 'MaxMara', '灰色', 'M', 158, '精洗', 'returned', 1],
      ['C202401150014', batch2Id, '卫十六', '13800138014', 'T恤', 'Nike', '白色', 'XL', 25, '水洗', 'washed', 0],
      ['C202401150015', batch2Id, '蒋十七', '13800138015', '裤子', 'Adidas', '黑色', 'L', 35, '水洗', 'washed', 0],
      ['C202401150016', batch2Id, '沈十八', '13800138016', '外套', 'Zara', '黑色', 'M', 58, '水洗', 'washed', 0],
      ['C202401150017', batch2Id, '韩十九', '13800138017', '毛衣', 'H&M', '蓝色', 'L', 45, '干洗', 'washed', 0],
      ['C202401150018', batch2Id, '杨二十', '13800138018', '西装', 'G2000', '黑色', '40', 88, '精洗+熨烫', 'washed', 0],
    ]
    
    clothesData.forEach(c => insertClothes.run(...c))

    const insertReturnOrder = db.prepare(`
      INSERT INTO return_orders (return_no, batch_id, store_id, store_name, total_count, signed_count, status, sent_at, sent_by, signed_at, signed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const returnOrder1Id = insertReturnOrder.run(
      'R20240114001', batch3Id, 3, '朝阳门店', 3, 3, 'completed',
      '2024-01-14 15:30:00', 1, '2024-01-14 16:00:00', 3
    ).lastInsertRowid

    const insertReturnItem = db.prepare(`
      INSERT INTO return_order_items (return_order_id, clothes_id, clothes_no, status, signed_at, signed_by, damage_found, damage_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertReturnItem.run(returnOrder1Id, 13, 'C202401150013', 'signed', '2024-01-14 16:00:00', 3, 1, '腰带丢失，已备注')

    const insertDamage = db.prepare(`
      INSERT INTO damage_records (clothes_id, damage_type, description, severity, evidence_photos, reported_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertDamage.run(3, '衣物破损', '袖口处有2cm左右的撕裂，客户取衣时未注意到', 'major', '', 2, 'pending')
    insertDamage.run(6, '污渍严重', '牛仔裤臀部有大片油渍，无法判断来源', 'critical', '', 2, 'pending')
    insertDamage.run(11, '褪色', '羽绒服领口处有明显褪色痕迹', 'minor', '', 2, 'confirmed')
    insertDamage.run(13, '配件缺失', '大衣腰带丢失', 'major', '', 2, 'rejected')

    const insertLog = db.prepare(`
      INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertLog.run(3, batch1Id, '上报污损', 2, '李质检', '袖口处有2cm左右的撕裂')
    insertLog.run(6, batch1Id, '上报污损', 2, '李质检', '牛仔裤臀部有大片油渍')
    insertLog.run(4, batch1Id, '状态变更为: washing', 2, '李质检', '')
    insertLog.run(1, batch1Id, '状态变更为: sorted', 2, '李质检', '')
    insertLog.run(2, batch1Id, '状态变更为: sorted', 2, '李质检', '')
    insertLog.run(1, batch1Id, '状态变更为: washed', 2, '李质检', '')
    insertLog.run(2, batch1Id, '状态变更为: washed', 2, '李质检', '')
    insertLog.run(5, batch1Id, '状态变更为: sorted', 2, '李质检', '')
    insertLog.run(5, batch1Id, '状态变更为: washed', 2, '李质检', '')
    insertLog.run(13, batch2Id, '污损复判: 退回门店', 1, '张厂长', '腰带丢失，客户索赔')
    insertLog.run(13, batch2Id, '加入回单，待门店签收', 1, '张厂长', '')
    insertLog.run(13, batch2Id, '门店签收（发现新污损）', 3, '门店小王', '腰带确实丢失')
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  createWindow()
})

app.on('window-all-closed', () => {
  if (db) db.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('db:login', (_, username: string, password: string) => {
  const user = db?.prepare('SELECT id, username, role, name FROM users WHERE username = ? AND password = ?').get(username, password)
  return user || null
})

ipcMain.handle('db:getUsers', () => {
  return db?.prepare('SELECT id, username, role, name FROM users').all()
})

ipcMain.handle('db:createBatch', (_, data: { batch_no: string; store_id: number; store_name: string }) => {
  const result = db?.prepare('INSERT INTO batches (batch_no, store_id, store_name) VALUES (?, ?, ?)').run(data.batch_no, data.store_id, data.store_name)
  return result?.lastInsertRowid
})

ipcMain.handle('db:getBatches', () => {
  return db?.prepare('SELECT * FROM batches ORDER BY received_at DESC').all()
})

ipcMain.handle('db:getBatchById', (_, id: number) => {
  return db?.prepare('SELECT * FROM batches WHERE id = ?').get(id)
})

ipcMain.handle('db:addClothes', (_, data: any) => {
  const result = db?.prepare(`
    INSERT INTO clothes (clothes_no, batch_id, customer_name, customer_phone, category, brand, color, size, price, services, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.clothes_no, data.batch_id, data.customer_name, data.customer_phone,
    data.category, data.brand, data.color, data.size, data.price, data.services,
    data.status || 'sorting'
  )
  const clothesId = result?.lastInsertRowid
  
  if (data.batch_id) {
    db?.prepare('UPDATE batches SET total_count = (SELECT COUNT(*) FROM clothes WHERE batch_id = ?) WHERE id = ?').run(data.batch_id, data.batch_id)
  }
  
  if (data.batch_id) {
    db?.prepare(`
      INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(clothesId, data.batch_id, '创建衣物记录', data.operator_id || 1, data.operator_name || 'system')
  }
  
  return clothesId
})

ipcMain.handle('db:batchAddClothes', (_, clothesList: any[]) => {
  const insertStmt = db?.prepare(`
    INSERT INTO clothes (clothes_no, batch_id, customer_name, customer_phone, category, brand, color, size, price, services, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const logStmt = db?.prepare(`
    INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?)
  `)
  const transaction = db?.transaction((list: any[]) => {
    for (const c of list) {
      const result = insertStmt?.run(c.clothes_no, c.batch_id, c.customer_name, c.customer_phone,
        c.category, c.brand, c.color, c.size, c.price, c.services, c.status || 'received')
      if (c.batch_id) {
        logStmt?.run(result?.lastInsertRowid, c.batch_id, '批量导入衣物', c.operator_id || 1, c.operator_name || 'system')
      }
    }
    if (list.length > 0 && list[0].batch_id) {
      db?.prepare('UPDATE batches SET total_count = (SELECT COUNT(*) FROM clothes WHERE batch_id = ?) WHERE id = ?').run(list[0].batch_id, list[0].batch_id)
    }
  })
  transaction?.(clothesList)
  return clothesList.length
})

ipcMain.handle('db:getClothesByBatch', (_, batchId: number) => {
  return db?.prepare('SELECT * FROM clothes WHERE batch_id = ? ORDER BY created_at DESC').all(batchId)
})

ipcMain.handle('db:getClothesById', (_, id: number) => {
  return db?.prepare('SELECT * FROM clothes WHERE id = ?').get(id)
})

ipcMain.handle('db:searchClothes', (_, keyword: string) => {
  return db?.prepare(`
    SELECT c.*, b.batch_no, b.store_name 
    FROM clothes c 
    LEFT JOIN batches b ON c.batch_id = b.id
    WHERE c.clothes_no LIKE ? OR c.customer_name LIKE ? OR c.customer_phone LIKE ?
    ORDER BY c.created_at DESC
    LIMIT 100
  `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
})

ipcMain.handle('db:updateClothesStatus', (_, id: number, status: string, operatorId: number, operatorName: string) => {
  const clothes = db?.prepare('SELECT id, batch_id FROM clothes WHERE id = ?').get(id) as any
  if (!clothes) {
    throw new Error('衣物记录不存在')
  }
  db?.prepare('UPDATE clothes SET status = ? WHERE id = ?').run(status, id)
  db?.prepare(`
    INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, clothes.batch_id, `状态变更为: ${status}`, operatorId, operatorName)
  return true
})

ipcMain.handle('db:reportDamage', (_, data: any) => {
  const clothes = db?.prepare('SELECT id, batch_id FROM clothes WHERE id = ?').get(data.clothes_id) as any
  if (!clothes) {
    throw new Error('衣物记录不存在，请先入库再上报污损')
  }
  
  const result = db?.prepare(`
    INSERT INTO damage_records (clothes_id, damage_type, description, severity, evidence_photos, reported_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.clothes_id, data.damage_type, data.description, data.severity, data.evidence_photos, data.reported_by)
  
  db?.prepare('UPDATE clothes SET has_damage = 1, status = ? WHERE id = ?').run('damage_reported', data.clothes_id)
  
  db?.prepare(`
    INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.clothes_id, clothes.batch_id, '上报污损', data.reported_by, data.reported_by_name, data.description)
  
  return result?.lastInsertRowid
})

ipcMain.handle('db:getDamageRecords', (_, status?: string) => {
  if (status) {
    return db?.prepare(`
      SELECT dr.*, c.clothes_no, c.category, c.customer_name, u.name as reporter_name
      FROM damage_records dr
      LEFT JOIN clothes c ON dr.clothes_id = c.id
      LEFT JOIN users u ON dr.reported_by = u.id
      WHERE dr.status = ?
      ORDER BY dr.created_at DESC
    `).all(status)
  }
  return db?.prepare(`
    SELECT dr.*, c.clothes_no, c.category, c.customer_name, u.name as reporter_name
    FROM damage_records dr
    LEFT JOIN clothes c ON dr.clothes_id = c.id
    LEFT JOIN users u ON dr.reported_by = u.id
    ORDER BY dr.created_at DESC
  `).all()
})

ipcMain.handle('db:resolveDamage', (_, data: any) => {
  const damageRecord = db?.prepare('SELECT clothes_id FROM damage_records WHERE id = ?').get(data.id) as any
  if (!damageRecord) {
    throw new Error('污损记录不存在')
  }
  
  const clothes = db?.prepare('SELECT id, batch_id FROM clothes WHERE id = ?').get(damageRecord.clothes_id) as any
  if (!clothes) {
    throw new Error('关联的衣物记录不存在')
  }
  
  db?.prepare(`
    UPDATE damage_records 
    SET status = ?, dispute_note = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, compensation_amount = ?
    WHERE id = ?
  `).run(data.status, data.dispute_note, data.resolved_by, data.compensation_amount, data.id)
  
  let newStatus = ''
  if (data.status === 'confirmed') {
    newStatus = 'washing'
    db?.prepare('UPDATE clothes SET status = ? WHERE id = ?').run(newStatus, clothes.id)
  } else if (data.status === 'rejected') {
    newStatus = 'return_to_store'
    db?.prepare('UPDATE clothes SET status = ? WHERE id = ?').run(newStatus, clothes.id)
  }
  
  db?.prepare(`
    INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    clothes.id, 
    clothes.batch_id, 
    `污损复判: ${data.status === 'confirmed' ? '确认洗涤' : '退回门店'}`, 
    data.resolved_by, 
    data.resolved_by_name || '系统',
    data.dispute_note || ''
  )
  
  return true
})

ipcMain.handle('db:getOperationLogs', (_, clothesId?: number, batchId?: number) => {
  let sql = 'SELECT * FROM operation_logs WHERE 1=1'
  const params: any[] = []
  if (clothesId) {
    sql += ' AND clothes_id = ?'
    params.push(clothesId)
  }
  if (batchId) {
    sql += ' AND batch_id = ?'
    params.push(batchId)
  }
  sql += ' ORDER BY created_at DESC LIMIT 200'
  return db?.prepare(sql).all(...params)
})

ipcMain.handle('db:saveCache', (_, key: string, data: string) => {
  db?.prepare(`
    INSERT OR REPLACE INTO cache_records (cache_key, cache_data, expires_at)
    VALUES (?, ?, DATETIME('now', '+7 days'))
  `).run(key, data)
  return true
})

ipcMain.handle('db:getCache', (_, key: string) => {
  const result = db?.prepare('SELECT cache_data FROM cache_records WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)').get(key) as any
  return result?.cache_data || null
})

ipcMain.handle('db:clearCache', (_, key: string) => {
  db?.prepare('DELETE FROM cache_records WHERE cache_key = ?').run(key)
  return true
})

ipcMain.handle('db:getReturnOrders', (_, storeId?: number) => {
  let sql = `
    SELECT ro.*, b.batch_no, b.total_count as batch_total, b.status as batch_status,
      (SELECT COUNT(*) FROM return_order_items roi WHERE roi.return_order_id = ro.id AND roi.status = 'signed') as actual_signed_count
    FROM return_orders ro
    LEFT JOIN batches b ON ro.batch_id = b.id
  `
  const params: any[] = []
  if (storeId) {
    sql += ' WHERE ro.store_id = ?'
    params.push(storeId)
  }
  sql += ' ORDER BY ro.created_at DESC'
  return db?.prepare(sql).all(...params)
})

ipcMain.handle('db:getReturnOrderById', (_, id: number) => {
  const order = db?.prepare(`
    SELECT ro.*, b.batch_no, b.total_count as batch_total, b.status as batch_status,
      (SELECT COUNT(*) FROM return_order_items roi WHERE roi.return_order_id = ro.id AND roi.status = 'signed') as actual_signed_count
    FROM return_orders ro
    LEFT JOIN batches b ON ro.batch_id = b.id
    WHERE ro.id = ?
  `).get(id)
  
  const items = db?.prepare(`
    SELECT roi.*, c.customer_name, c.category, c.status as clothes_status
    FROM return_order_items roi
    LEFT JOIN clothes c ON roi.clothes_id = c.id
    WHERE roi.return_order_id = ?
    ORDER BY roi.created_at
  `).all(id)
  
  return order ? { ...(order as object), items } : null
})

ipcMain.handle('db:createReturnOrder', (_, data: { batch_id: number; store_id: number; store_name: string; sent_by?: number; sent_by_name?: string }) => {
  const batch = db?.prepare('SELECT * FROM batches WHERE id = ?').get(data.batch_id) as any
  if (!batch) throw new Error('批次不存在')
  
  const clothes = db?.prepare(`
    SELECT * FROM clothes 
    WHERE batch_id = ? AND status IN ('washed', 'return_to_store')
  `).all(data.batch_id) as any[]
  
  if (!clothes || clothes.length === 0) {
    throw new Error('该批次没有可返回的衣物')
  }
  
  const returnNo = `R${Date.now()}`
  
  const result = db?.prepare(`
    INSERT INTO return_orders (return_no, batch_id, store_id, store_name, total_count, status, sent_at, sent_by)
    VALUES (?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP, ?)
  `).run(returnNo, data.batch_id, data.store_id, data.store_name, clothes.length, data.sent_by || 1)
  
  const orderId = result?.lastInsertRowid
  
  const insertItem = db?.prepare(`
    INSERT INTO return_order_items (return_order_id, clothes_id, clothes_no)
    VALUES (?, ?, ?)
  `)
  
  clothes.forEach((c: any) => {
    insertItem?.run(orderId, c.id, c.clothes_no)
    db?.prepare('UPDATE clothes SET status = ? WHERE id = ?').run('returning', c.id)
    db?.prepare(`
      INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(c.id, data.batch_id, '加入回单，待门店签收', data.sent_by || 1, data.sent_by_name || '系统')
  })
  
  const remainingCount = db?.prepare(`
    SELECT COUNT(*) as count FROM clothes 
    WHERE batch_id = ? AND status NOT IN ('returning', 'returned', 'return_to_store')
  `).get(data.batch_id) as any
  
  if (!remainingCount || remainingCount.count === 0) {
    db?.prepare('UPDATE batches SET status = ? WHERE id = ?').run('returning', data.batch_id)
  }
  
  return orderId
})

ipcMain.handle('db:signReturnOrderItem', (_, data: { 
  item_id: number; 
  clothes_id: number;
  signed_by: number; 
  signed_by_name: string;
  damage_found?: number;
  damage_note?: string;
}) => {
  const item = db?.prepare('SELECT * FROM return_order_items WHERE id = ?').get(data.item_id) as any
  if (!item) throw new Error('回单项不存在')
  
  db?.prepare(`
    UPDATE return_order_items 
    SET status = 'signed', signed_at = CURRENT_TIMESTAMP, signed_by = ?, damage_found = ?, damage_note = ?
    WHERE id = ?
  `).run(data.signed_by, data.damage_found || 0, data.damage_note || '', data.item_id)
  
  db?.prepare(`
    UPDATE clothes 
    SET status = 'returned', returned_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(data.clothes_id)
  
  const orderItem = db?.prepare('SELECT return_order_id FROM return_order_items WHERE id = ?').get(data.item_id) as any
  const order = db?.prepare(`
    SELECT ro.*, (SELECT COUNT(*) FROM return_order_items WHERE return_order_id = ro.id AND status = 'signed') as signed_count
    FROM return_orders ro WHERE ro.id = ?
  `).get(orderItem.return_order_id) as any
  
  db?.prepare(`
    UPDATE return_orders SET signed_count = ? WHERE id = ?
  `).run(order.signed_count, orderItem.return_order_id)
  
  if (order.signed_count >= order.total_count) {
    db?.prepare(`
      UPDATE return_orders 
      SET status = 'completed', signed_at = CURRENT_TIMESTAMP, signed_by = ?
      WHERE id = ?
    `).run(data.signed_by, orderItem.return_order_id)
    
    db?.prepare(`
      UPDATE batches 
      SET status = 'completed', returned_at = CURRENT_TIMESTAMP, returned_by = ?
      WHERE id = (SELECT batch_id FROM return_orders WHERE id = ?)
    `).run(data.signed_by, orderItem.return_order_id)
  }
  
  db?.prepare(`
    INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name, note)
    VALUES (?, (SELECT batch_id FROM return_orders WHERE id = ?), ?, ?, ?, ?)
  `).run(
    data.clothes_id, 
    orderItem.return_order_id,
    data.damage_found ? '门店签收（发现新污损）' : '门店签收确认',
    data.signed_by,
    data.signed_by_name,
    data.damage_note || ''
  )
  
  return true
})

ipcMain.handle('db:batchSignReturnOrder', (_, data: {
  order_id: number;
  signed_by: number;
  signed_by_name: string;
}) => {
  const items = db?.prepare('SELECT * FROM return_order_items WHERE return_order_id = ? AND status = ?').all(data.order_id, 'pending') as any[]
  
  const transaction = db?.transaction(() => {
    for (const item of items) {
      db?.prepare(`
        UPDATE return_order_items 
        SET status = 'signed', signed_at = CURRENT_TIMESTAMP, signed_by = ?
        WHERE id = ?
      `).run(data.signed_by, item.id)
      
      db?.prepare(`
        UPDATE clothes 
        SET status = 'returned', returned_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(item.clothes_id)
      
      db?.prepare(`
        INSERT INTO operation_logs (clothes_id, batch_id, operation, operator_id, operator_name)
        VALUES (?, (SELECT batch_id FROM return_orders WHERE id = ?), ?, ?, ?)
      `).run(
        item.clothes_id, 
        data.order_id,
        '门店批量签收确认',
        data.signed_by,
        data.signed_by_name
      )
    }
    
    db?.prepare(`
      UPDATE return_orders 
      SET status = 'completed', signed_count = total_count, signed_at = CURRENT_TIMESTAMP, signed_by = ?
      WHERE id = ?
    `).run(data.signed_by, data.order_id)
    
    db?.prepare(`
      UPDATE batches 
      SET status = 'completed', returned_at = CURRENT_TIMESTAMP, returned_by = ?
      WHERE id = (SELECT batch_id FROM return_orders WHERE id = ?)
    `).run(data.signed_by, data.order_id)
  })
  
  transaction?.()
  
  return items.length
})

ipcMain.handle('db:getClothesForReturn', (_, storeId?: number) => {
  let sql = `
    SELECT c.*, b.batch_no, b.store_name, b.id as batch_id
    FROM clothes c
    LEFT JOIN batches b ON c.batch_id = b.id
    WHERE c.status IN ('washed', 'return_to_store')
  `
  const params: any[] = []
  if (storeId) {
    sql += ' AND b.store_id = ?'
    params.push(storeId)
  }
  sql += ' ORDER BY c.created_at DESC'
  return db?.prepare(sql).all(...params)
})

ipcMain.handle('app:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('app:selectFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Excel文件', extensions: ['xlsx', 'xls'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('app:showMessageBox', async (_, options: any) => {
  return dialog.showMessageBox(mainWindow!, options)
})
