const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')

let mainWindow
let db

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'scrap-station.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT UNIQUE NOT NULL,
      driver_name TEXT,
      driver_phone TEXT,
      vehicle_type TEXT,
      tare_weight REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      unit TEXT DEFAULT 'kg',
      current_price REAL NOT NULL,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      old_price REAL NOT NULL,
      new_price REAL NOT NULL,
      changed_by INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS weighings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weighing_no TEXT UNIQUE NOT NULL,
      vehicle_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      gross_weight REAL NOT NULL,
      tare_weight REAL NOT NULL,
      net_weight REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      weigher_id INTEGER NOT NULL,
      photo_paths TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (weigher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      weighing_ids TEXT NOT NULL,
      total_weight REAL NOT NULL,
      total_amount REAL NOT NULL,
      actual_amount REAL NOT NULL,
      deduction REAL DEFAULT 0,
      deduction_reason TEXT,
      status TEXT DEFAULT 'pending',
      accountant_id INTEGER,
      reviewer_id INTEGER,
      payment_method TEXT,
      payment_time DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountant_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      related_id INTEGER,
      description TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      resolved INTEGER DEFAULT 0,
      resolved_by INTEGER,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS env_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date DATE NOT NULL,
      record_type TEXT NOT NULL,
      content TEXT NOT NULL,
      recorder_id INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recorder_id) REFERENCES users(id)
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)
    `)
    insertUser.run('admin', 'admin123', 'owner', '张老板')
    insertUser.run('weigher', 'weigher123', 'weigher', '李过磅')
    insertUser.run('accountant', 'account123', 'accountant', '王财务')
  }

  const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count
  if (materialCount === 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO materials (name, code, unit, current_price, category) VALUES (?, ?, ?, ?, ?)
    `)
    insertMaterial.run('废铁', 'FE001', 'kg', 1.2, '黑色金属')
    insertMaterial.run('废钢', 'FE002', 'kg', 1.5, '黑色金属')
    insertMaterial.run('废铜', 'CU001', 'kg', 25.0, '有色金属')
    insertMaterial.run('废铝', 'AL001', 'kg', 8.5, '有色金属')
    insertMaterial.run('废纸', 'PAP001', 'kg', 0.8, '废纸')
    insertMaterial.run('废塑料', 'PLA001', 'kg', 1.0, '塑料')
  }
}

ipcMain.handle('db-query', (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql)
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return { success: true, data: stmt.all(...params) }
    } else {
      const result = stmt.run(...params)
      return { success: true, data: { lastInsertRowid: result.lastInsertRowid, changes: result.changes } }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-exec', (event, sql) => {
  try {
    db.exec(sql)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData')
})

app.whenReady().then(() => {
  initDatabase()
  createWindow()
})

app.on('window-all-closed', () => {
  if (db) db.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
