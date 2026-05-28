import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import dayjs from 'dayjs'

let db: Database

const getDbPath = () => {
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  return path.join(dbDir, 'film_storage.db')
}

export const setupDatabase = () => {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  
  initTables()
  initDemoData()
}

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      wechatId TEXT,
      memberLevel TEXT NOT NULL DEFAULT 'normal',
      storageMonths INTEGER NOT NULL DEFAULT 6,
      totalFilms INTEGER NOT NULL DEFAULT 0,
      activeFilms INTEGER NOT NULL DEFAULT 0,
      remark TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS films (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER NOT NULL,
      memberName TEXT NOT NULL,
      filmNo TEXT NOT NULL UNIQUE,
      filmType TEXT NOT NULL,
      filmBrand TEXT NOT NULL,
      iso TEXT NOT NULL,
      format TEXT NOT NULL,
      shots INTEGER NOT NULL,
      processType TEXT NOT NULL,
      scanResolution TEXT NOT NULL,
      deliveryVersion TEXT NOT NULL DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'registered',
      storageStartDate TEXT NOT NULL,
      storageEndDate TEXT NOT NULL,
      isUrgent INTEGER NOT NULL DEFAULT 0,
      remark TEXT,
      rejectReason TEXT,
      reworkCount INTEGER NOT NULL DEFAULT 0,
      currentHandler TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (memberId) REFERENCES members(id)
    );

    CREATE INDEX IF NOT EXISTS idx_films_status ON films(status);
    CREATE INDEX IF NOT EXISTS idx_films_memberId ON films(memberId);
    CREATE INDEX IF NOT EXISTS idx_films_storageEndDate ON films(storageEndDate);

    CREATE TABLE IF NOT EXISTS process_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filmId INTEGER NOT NULL,
      filmNo TEXT NOT NULL,
      memberId INTEGER NOT NULL,
      memberName TEXT NOT NULL,
      action TEXT NOT NULL,
      previousStatus TEXT NOT NULL,
      newStatus TEXT NOT NULL,
      operator TEXT NOT NULL,
      remark TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (filmId) REFERENCES films(id)
    );

    CREATE INDEX IF NOT EXISTS idx_process_filmId ON process_records(filmId);

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      filmId INTEGER NOT NULL,
      filmNo TEXT NOT NULL,
      memberId INTEGER NOT NULL,
      memberName TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      isDismissed INTEGER NOT NULL DEFAULT 0,
      dismissedAt TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_dismissed ON reminders(isDismissed);
    CREATE INDEX IF NOT EXISTS idx_reminders_dueDate ON reminders(dueDate);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      targetId INTEGER,
      operator TEXT NOT NULL,
      detail TEXT NOT NULL,
      ip TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `)
}

const initDemoData = () => {
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get() as { count: number }
  if (memberCount.count > 0) return

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  
  const insertMember = db.prepare(`
    INSERT INTO members (name, phone, wechatId, memberLevel, storageMonths, totalFilms, activeFilms, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertFilm = db.prepare(`
    INSERT INTO films (memberId, memberName, filmNo, filmType, filmBrand, iso, format, shots, processType, scanResolution, deliveryVersion, status, storageStartDate, storageEndDate, isUrgent, remark, rejectReason, reworkCount, currentHandler, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertReminder = db.prepare(`
    INSERT INTO reminders (type, filmId, filmNo, memberId, memberName, title, content, dueDate, priority, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAuditLog = db.prepare(`
    INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const members = [
    { name: '张三', phone: '13800138001', wechatId: 'zhangsan_wx', level: 'gold' as const, months: 12 },
    { name: '李四', phone: '13800138002', wechatId: 'lisi_wx', level: 'silver' as const, months: 6 },
    { name: '王五', phone: '13800138003', wechatId: 'wangwu_wx', level: 'diamond' as const, months: 24 },
    { name: '赵六', phone: '13800138004', level: 'normal' as const, months: 3 },
    { name: '陈七', phone: '13800138005', wechatId: 'chenqi_wx', level: 'gold' as const, months: 12 }
  ]

  const memberIds: number[] = []
  members.forEach((m, idx) => {
    const result = insertMember.run(m.name, m.phone, m.wechatId || null, m.level, m.months, 0, 0, now, now)
    memberIds.push(result.lastInsertRowid as number)
  })

  const films = [
    {
      memberId: memberIds[0], memberName: '张三', filmNo: 'FLM202401001',
      type: '彩色负片', brand: 'Kodak', iso: '400', format: '135' as const, shots: 36,
      processType: 'C-41', resolution: '3000dpi', version: 'high' as const,
      status: 'waiting_process' as const, urgent: 1,
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(12, 'month').format('YYYY-MM-DD'),
      handler: '冲扫员A'
    },
    {
      memberId: memberIds[0], memberName: '张三', filmNo: 'FLM202401002',
      type: '黑白负片', brand: 'Ilford', iso: '400', format: '135' as const, shots: 36,
      processType: 'D-76', resolution: '4000dpi', version: 'standard' as const,
      status: 'rework' as const, urgent: 0,
      startDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().subtract(3, 'day').add(12, 'month').format('YYYY-MM-DD'),
      handler: '冲扫员B',
      remark: '暗部颗粒需优化',
      rejectReason: '扫描有划痕',
      reworkCount: 1
    },
    {
      memberId: memberIds[1], memberName: '李四', filmNo: 'FLM202401003',
      type: '彩色负片', brand: 'Fujifilm', iso: '200', format: '135' as const, shots: 24,
      processType: 'C-41', resolution: '3000dpi', version: 'standard' as const,
      status: 'registered' as const, urgent: 0,
      startDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().subtract(1, 'day').add(6, 'month').format('YYYY-MM-DD'),
      handler: null
    },
    {
      memberId: memberIds[2], memberName: '王五', filmNo: 'FLM202401004',
      type: '彩色反转片', brand: 'Kodak', iso: '100', format: '120' as const, shots: 12,
      processType: 'E-6', resolution: '4000dpi', version: 'raw' as const,
      status: 'processing' as const, urgent: 1,
      startDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().subtract(2, 'day').add(24, 'month').format('YYYY-MM-DD'),
      handler: '冲扫员A'
    },
    {
      memberId: memberIds[2], memberName: '王五', filmNo: 'FLM202401005',
      type: '黑白负片', brand: 'Kodak', iso: '3200', format: '120' as const, shots: 15,
      processType: 'D-76', resolution: '4000dpi', version: 'high' as const,
      status: 'waiting_delivery' as const, urgent: 0,
      startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().subtract(7, 'day').add(24, 'month').format('YYYY-MM-DD'),
      handler: '冲扫员B'
    },
    {
      memberId: memberIds[3], memberName: '赵六', filmNo: 'FLM202401006',
      type: '彩色负片', brand: 'Fujifilm', iso: '800', format: '135' as const, shots: 36,
      processType: 'C-41', resolution: '3000dpi', version: 'standard' as const,
      status: 'stored' as const, urgent: 0,
      startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      handler: null,
      remark: '即将到期，请提醒客户'
    },
    {
      memberId: memberIds[4], memberName: '陈七', filmNo: 'FLM202401007',
      type: '彩色负片', brand: 'Cinestill', iso: '800', format: '135' as const, shots: 36,
      processType: 'C-41', resolution: '4000dpi', version: 'high' as const,
      status: 'delivered' as const, urgent: 0,
      startDate: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().subtract(14, 'day').add(12, 'month').format('YYYY-MM-DD'),
      handler: '冲扫员A'
    },
    {
      memberId: memberIds[1], memberName: '李四', filmNo: 'FLM202401008',
      type: '黑白负片', brand: 'Ilford', iso: '3200', format: '135' as const, shots: 24,
      processType: 'D-76', resolution: '3000dpi', version: 'standard' as const,
      status: 'registered' as const, urgent: 0,
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(6, 'month').format('YYYY-MM-DD'),
      handler: null
    }
  ]

  const filmIds: number[] = []
  films.forEach(f => {
    const result = insertFilm.run(
      f.memberId, f.memberName, f.filmNo, f.type, f.brand, f.iso, f.format,
      f.shots, f.processType, f.resolution, f.version, f.status,
      f.startDate, f.endDate, f.urgent, f.remark || null, f.rejectReason || null, f.reworkCount || 0, f.handler || null, now, now
    )
    filmIds.push(result.lastInsertRowid as number)

    db.prepare('UPDATE members SET totalFilms = totalFilms + 1, activeFilms = activeFilms + 1 WHERE id = ?').run(f.memberId)
  })

  const reminders = [
    {
      type: 'rework' as const, filmId: filmIds[1], filmNo: films[1].filmNo,
      memberId: films[1].memberId, memberName: films[1].memberName,
      title: '胶卷需要返工', content: '扫描有划痕，暗部颗粒需优化，请重新处理',
      dueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), priority: 'high' as const
    },
    {
      type: 'pending' as const, filmId: filmIds[2], filmNo: films[2].filmNo,
      memberId: films[2].memberId, memberName: films[2].memberName,
      title: '待分配冲扫员', content: '新登记胶卷，等待分配处理人员',
      dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), priority: 'medium' as const
    },
    {
      type: 'expire' as const, filmId: filmIds[5], filmNo: films[5].filmNo,
      memberId: films[5].memberId, memberName: films[5].memberName,
      title: '胶卷即将到期', content: '寄存将于3天后到期，请及时联系客户确认处理方式',
      dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD'), priority: 'high' as const
    },
    {
      type: 'pending' as const, filmId: filmIds[7], filmNo: films[7].filmNo,
      memberId: films[7].memberId, memberName: films[7].memberName,
      title: '待分配冲扫员', content: '新登记胶卷，等待分配处理人员',
      dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), priority: 'medium' as const
    }
  ]

  reminders.forEach(r => {
    insertReminder.run(r.type, r.filmId, r.filmNo, r.memberId, r.memberName, r.title, r.content, r.dueDate, r.priority, now)
  })

  insertAuditLog.run('初始化数据', 'system', null, 'system', '系统初始化演示数据', now)
}

export const getDb = () => db

export const setDb = (newDb: Database) => {
  db = newDb
}

export { getDbPath }
