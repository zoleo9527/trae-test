import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let db: Database.Database | null = null

function getDbPath(): string {
  const dbDir = join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  return join(dbDir, 'natatorium.db')
}

function initDatabase(): void {
  db = new Database(getDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('director', 'head_coach', 'reception')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lockers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locker_no TEXT UNIQUE NOT NULL,
      zone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance', 'damaged')),
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'frozen', 'expired')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      specialty TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      coach_id INTEGER,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 10,
      enrolled INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (coach_id) REFERENCES coaches(id)
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'enrolled' CHECK(status IN ('enrolled', 'attended', 'absent', 'leave')),
      checkin_time INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(course_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('recharge', 'consume', 'refund')),
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      related_id INTEGER,
      operator_id INTEGER,
      note TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS locker_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locker_id INTEGER NOT NULL,
      member_id INTEGER,
      guest_name TEXT,
      assign_type TEXT NOT NULL CHECK(assign_type IN ('member', 'guest', 'temporary')),
      assigned_at INTEGER NOT NULL,
      expired_at INTEGER,
      released_at INTEGER,
      operator_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'released', 'overdue')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (locker_id) REFERENCES lockers(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS patrol_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_path TEXT NOT NULL,
      location TEXT NOT NULL,
      issue_type TEXT,
      description TEXT,
      reporter_id INTEGER,
      status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'processing', 'resolved', 'ignored')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appeal_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('locker_issue', 'course_leave', 'billing_error', 'water_quality', 'other')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      related_locker_id INTEGER,
      related_course_id INTEGER,
      related_transaction_id INTEGER,
      reporter_id INTEGER,
      assignee_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'rejected', 'escalated')),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (related_locker_id) REFERENCES lockers(id),
      FOREIGN KEY (related_course_id) REFERENCES courses(id),
      FOREIGN KEY (related_transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appeal_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appeal_id INTEGER NOT NULL,
      actor_id INTEGER,
      action TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (appeal_id) REFERENCES appeals(id),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
  `)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 768,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '游泳馆运营控制台',
      submenu: [
        { role: 'about', label: '关于' },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '操作',
      submenu: [
        {
          label: '新建申诉',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-appeal')
        },
        {
          label: '分配储物柜',
          accelerator: 'CmdOrCtrl+L',
          click: () => mainWindow?.webContents.send('menu:assign-locker')
        },
        { type: 'separator' },
        { role: 'reload', label: '刷新' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换角色视图',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('menu:switch-role')
        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

ipcMain.handle('db:query', (_e, sql: string, params: any[] = []) => {
  if (!db) return []
  return db.prepare(sql).all(...params)
})

ipcMain.handle('db:run', (_e, sql: string, params: any[] = []) => {
  if (!db) return { changes: 0, lastInsertRowid: 0 }
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
})

ipcMain.handle('db:transaction', (_e, statements: { sql: string; params?: any[] }[]) => {
  if (!db) return
  const tx = db.transaction((stmts: { sql: string; params?: any[] }[]) => {
    for (const s of stmts) {
      db!.prepare(s.sql).run(...(s.params || []))
    }
  })
  tx(statements)
})

ipcMain.handle('app:getAppDataPath', () => app.getPath('userData'))

let currentUser: any = null
ipcMain.handle('app:getCurrentUser', () => currentUser)
ipcMain.handle('app:setCurrentUser', (_e, user) => {
  currentUser = user
  return true
})

app.whenReady().then(() => {
  initDatabase()
  createWindow()
  createMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (db) db.close()
  if (process.platform !== 'darwin') app.quit()
})
