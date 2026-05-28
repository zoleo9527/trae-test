import { ipcMain, app } from 'electron'
import { getDb, getDbPath, setDb } from './database'
import dayjs from 'dayjs'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import Database from 'better-sqlite3'
import type { Statement } from 'better-sqlite3'
import type { 
  Member, Film, ProcessRecord, Reminder, AuditLog, 
  DashboardStats, PaginationParams, PaginatedResult 
} from '@/types'

const getNow = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const buildWhereClause = (params: PaginationParams) => {
  const conditions: string[] = []
  const values: any[] = []
  
  if (params.keyword) {
    conditions.push('(name LIKE ? OR phone LIKE ? OR wechatId LIKE ?)')
    const kw = `%${params.keyword}%`
    values.push(kw, kw, kw)
  }
  
  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values }
}

const buildFilmWhereClause = (params: PaginationParams) => {
  const conditions: string[] = []
  const values: any[] = []
  
  if (params.keyword) {
    conditions.push('(filmNo LIKE ? OR memberName LIKE ? OR filmBrand LIKE ? OR filmType LIKE ?)')
    const kw = `%${params.keyword}%`
    values.push(kw, kw, kw, kw)
  }
  
  if (params.status) {
    conditions.push('status = ?')
    values.push(params.status)
  }
  
  if (params.memberId) {
    conditions.push('memberId = ?')
    values.push(params.memberId)
  }
  
  if (params.startDate) {
    conditions.push('createdAt >= ?')
    values.push(params.startDate)
  }
  
  if (params.endDate) {
    conditions.push('createdAt <= ?')
    values.push(params.endDate)
  }
  
  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values }
}

export const setupIpcHandlers = () => {

  ipcMain.handle('db:get-members', async (_, params: PaginationParams = {}) => {
    const db = getDb()
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize
    
    const { clause, values } = buildWhereClause(params)
    
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM members ${clause}`)
    const { count } = countStmt.get(...values) as { count: number }
    
    const stmt = db.prepare(`SELECT * FROM members ${clause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`)
    const data = stmt.all(...values, pageSize, offset) as Member[]
    
    return { data, total: count, page, pageSize } as PaginatedResult<Member>
  })

  ipcMain.handle('db:get-member', async (_, id: number) => {
    const db = getDb()
    return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member
  })

  ipcMain.handle('db:create-member', async (_, data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    const db = getDb()
    const now = getNow()
    const stmt = db.prepare(`
      INSERT INTO members (name, phone, wechatId, memberLevel, storageMonths, totalFilms, activeFilms, remark, createdAt, updatedAt)
      VALUES (@name, @phone, @wechatId, @memberLevel, @storageMonths, 0, 0, @remark, @now, @now)
    `)
    const result = stmt.run({ ...data, now })
    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run('create', 'member', result.lastInsertRowid, 'current_user', `创建会员: ${data.name}`, now)
    return result.lastInsertRowid
  })

  ipcMain.handle('db:update-member', async (_, id: number, data: Partial<Member>) => {
    const db = getDb()
    const now = getNow()
    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = [...Object.values(data), now, id]
    db.prepare(`UPDATE members SET ${sets}, updatedAt = ? WHERE id = ?`).run(...values)
    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run('update', 'member', id, 'current_user', `更新会员信息: ${JSON.stringify(data)}`, now)
    return true
  })

  ipcMain.handle('db:delete-member', async (_, id: number) => {
    const db = getDb()
    const now = getNow()
    const member = db.prepare('SELECT name FROM members WHERE id = ?').get(id) as Member
    db.prepare('DELETE FROM members WHERE id = ?').run(id)
    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run('delete', 'member', id, 'current_user', `删除会员: ${member?.name}`, now)
    return true
  })

  ipcMain.handle('db:get-films', async (_, params: PaginationParams = {}) => {
    const db = getDb()
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize
    
    const { clause, values } = buildFilmWhereClause(params)
    
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM films ${clause}`)
    const { count } = countStmt.get(...values) as { count: number }
    
    const stmt = db.prepare(`SELECT * FROM films ${clause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`)
    const data = stmt.all(...values, pageSize, offset) as Film[]
    
    return { data, total: count, page, pageSize } as PaginatedResult<Film>
  })

  ipcMain.handle('db:get-film', async (_, id: number) => {
    const db = getDb()
    const film = db.prepare('SELECT * FROM films WHERE id = ?').get(id) as Film
    const records = db.prepare('SELECT * FROM process_records WHERE filmId = ? ORDER BY timestamp DESC').all(id) as ProcessRecord[]
    return { ...film, processRecords: records }
  })

  ipcMain.handle('db:check-film-duplicate', async (_, filmNo: string, excludeId?: number) => {
    const db = getDb()
    let stmt: Statement
    if (excludeId) {
      stmt = db.prepare('SELECT COUNT(*) as count FROM films WHERE filmNo = ? AND id != ?')
      const result = stmt.get(filmNo, excludeId) as { count: number }
      return result.count > 0
    } else {
      stmt = db.prepare('SELECT COUNT(*) as count FROM films WHERE filmNo = ?')
      const result = stmt.get(filmNo) as { count: number }
      return result.count > 0
    }
  })

  ipcMain.handle('db:create-film', async (_, data: Omit<Film, 'id' | 'createdAt' | 'updatedAt' | 'reworkCount'>) => {
    const db = getDb()
    const now = getNow()
    const isDuplicate = db.prepare('SELECT COUNT(*) as count FROM films WHERE filmNo = ?').get(data.filmNo) as { count: number }
    if (isDuplicate.count > 0) {
      throw new Error(`胶卷编号 ${data.filmNo} 已存在`)
    }

    const stmt = db.prepare(`
      INSERT INTO films (memberId, memberName, filmNo, filmType, filmBrand, iso, format, shots, 
        processType, scanResolution, deliveryVersion, status, storageStartDate, storageEndDate, 
        isUrgent, remark, rejectReason, reworkCount, currentHandler, createdAt, updatedAt)
      VALUES (@memberId, @memberName, @filmNo, @filmType, @filmBrand, @iso, @format, @shots,
        @processType, @scanResolution, @deliveryVersion, @status, @storageStartDate, @storageEndDate,
        @isUrgent, @remark, @rejectReason, 0, @currentHandler, @now, @now)
    `)
    const result = stmt.run({ ...data, now })
    const filmId = result.lastInsertRowid as number

    db.prepare('UPDATE members SET totalFilms = totalFilms + 1, activeFilms = activeFilms + 1 WHERE id = ?').run(data.memberId)

    db.prepare(`
      INSERT INTO process_records (filmId, filmNo, memberId, memberName, action, previousStatus, newStatus, operator, remark, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(filmId, data.filmNo, data.memberId, data.memberName, 'register', '-', data.status, data.currentHandler || 'system', '胶卷登记入库', now)

    db.prepare(`
      INSERT INTO reminders (type, filmId, filmNo, memberId, memberName, title, content, dueDate, priority, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('pending', filmId, data.filmNo, data.memberId, data.memberName, '待分配冲扫员', '新登记胶卷，等待分配处理人员', 
           dayjs().add(2, 'day').format('YYYY-MM-DD'), 'medium', now)

    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run('create', 'film', filmId, 'current_user', `登记胶卷: ${data.filmNo}`, now)

    return filmId
  })

  ipcMain.handle('db:update-film', async (_, id: number, data: Partial<Film>) => {
    const db = getDb()
    const now = getNow()
    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = [...Object.values(data), now, id]
    db.prepare(`UPDATE films SET ${sets}, updatedAt = ? WHERE id = ?`).run(...values)
    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run('update', 'film', id, 'current_user', `更新胶卷信息: ${JSON.stringify(data)}`, now)
    return true
  })

  ipcMain.handle('db:delete-film', async (_, id: number) => {
    const db = getDb()
    const now = getNow()
    const film = db.prepare('SELECT filmNo, memberId FROM films WHERE id = ?').get(id) as Film
    db.prepare('DELETE FROM films WHERE id = ?').run(id)
    if (film) {
      db.prepare('UPDATE members SET activeFilms = activeFilms - 1 WHERE id = ?').run(film.memberId)
    }
    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run('delete', 'film', id, 'current_user', `删除胶卷: ${film?.filmNo}`, now)
    return true
  })

  ipcMain.handle('db:get-process-records', async (_, params: PaginationParams = {}) => {
    const db = getDb()
    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const offset = (page - 1) * pageSize
    
    const conditions: string[] = []
    const values: any[] = []
    
    if (params.keyword) {
      conditions.push('(filmNo LIKE ? OR memberName LIKE ?)')
      const kw = `%${params.keyword}%`
      values.push(kw, kw)
    }
    
    if (params.memberId) {
      conditions.push('memberId = ?')
      values.push(params.memberId)
    }
    
    const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM process_records ${clause}`)
    const { count } = countStmt.get(...values) as { count: number }
    
    const stmt = db.prepare(`SELECT * FROM process_records ${clause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
    const data = stmt.all(...values, pageSize, offset) as ProcessRecord[]
    
    return { data, total: count, page, pageSize } as PaginatedResult<ProcessRecord>
  })

  ipcMain.handle('db:create-process-record', async (_, data: Omit<ProcessRecord, 'id' | 'timestamp'>) => {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO process_records (filmId, filmNo, memberId, memberName, action, previousStatus, newStatus, operator, remark, timestamp)
      VALUES (@filmId, @filmNo, @memberId, @memberName, @action, @previousStatus, @newStatus, @operator, @remark, @now)
    `)
    const result = stmt.run({ ...data, now: getNow() })
    
    const updateData: any = { status: data.newStatus, currentHandler: data.operator }
    
    if (data.action === 'reject') {
      updateData.rejectReason = data.remark
    }
    
    if (data.action === 'rework') {
      const currentRework = db.prepare('SELECT reworkCount FROM films WHERE id = ?').get(data.filmId) as { reworkCount: number }
      updateData.reworkCount = (currentRework?.reworkCount || 0) + 1
      updateData.rejectReason = data.remark
    }
    
    if (data.action === 'deliver') {
      updateData.currentHandler = null
    }
    
    const sets = Object.keys(updateData).map(k => `${k} = ?`).join(', ')
    const values = [...Object.values(updateData), getNow(), data.filmId]
    db.prepare(`UPDATE films SET ${sets}, updatedAt = ? WHERE id = ?`).run(...values)

    if (data.action === 'reject') {
      db.prepare(`
        INSERT INTO reminders (type, filmId, filmNo, memberId, memberName, title, content, dueDate, priority, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('reject', data.filmId, data.filmNo, data.memberId, data.memberName, '胶卷被驳回', 
             data.remark || '质量检查未通过，需要返工', dayjs().add(1, 'day').format('YYYY-MM-DD'), 'high', getNow())
    } else if (data.action === 'rework') {
      db.prepare(`
        INSERT INTO reminders (type, filmId, filmNo, memberId, memberName, title, content, dueDate, priority, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('rework', data.filmId, data.filmNo, data.memberId, data.memberName, '胶卷需要返工', 
             data.remark || '根据驳回原因重新处理', dayjs().add(2, 'day').format('YYYY-MM-DD'), 'high', getNow())
    }

    db.prepare('INSERT INTO audit_logs (action, module, targetId, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
      .run(data.action, 'process', data.filmId, data.operator, 
           `${data.filmNo}: ${data.previousStatus} -> ${data.newStatus}`, getNow())

    return result.lastInsertRowid
  })

  ipcMain.handle('db:get-reminders', async (_, params: PaginationParams = {}) => {
    const db = getDb()
    const conditions: string[] = ['isDismissed = 0']
    const values: any[] = []
    
    if (params.keyword) {
      conditions.push('(filmNo LIKE ? OR memberName LIKE ? OR title LIKE ?)')
      const kw = `%${params.keyword}%`
      values.push(kw, kw, kw)
    }
    
    const clause = `WHERE ${conditions.join(' AND ')}`
    
    const stmt = db.prepare(`SELECT * FROM reminders ${clause} ORDER BY priority DESC, dueDate ASC, createdAt DESC`)
    const data = stmt.all(...values) as Reminder[]
    
    return { data, total: data.length, page: 1, pageSize: data.length } as PaginatedResult<Reminder>
  })

  ipcMain.handle('db:update-reminder', async (_, id: number, data: Partial<Reminder>) => {
    const db = getDb()
    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
    const values = [...Object.values(data), id]
    db.prepare(`UPDATE reminders SET ${sets} WHERE id = ?`).run(...values)
    return true
  })

  ipcMain.handle('db:dismiss-reminder', async (_, id: number) => {
    const db = getDb()
    const now = getNow()
    db.prepare('UPDATE reminders SET isDismissed = 1, dismissedAt = ? WHERE id = ?').run(now, id)
    return true
  })

  ipcMain.handle('db:get-audit-logs', async (_, params: PaginationParams = {}) => {
    const db = getDb()
    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const offset = (page - 1) * pageSize
    
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM audit_logs')
    const { count } = countStmt.get() as { count: number }
    
    const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?')
    const data = stmt.all(pageSize, offset) as AuditLog[]
    
    return { data, total: count, page, pageSize } as PaginatedResult<AuditLog>
  })

  ipcMain.handle('db:get-dashboard-stats', async () => {
    const db = getDb()
    const pending = db.prepare("SELECT COUNT(*) as count FROM films WHERE status IN ('registered', 'waiting_process')").get() as { count: number }
    const rejected = db.prepare("SELECT COUNT(*) as count FROM films WHERE status = 'rework'").get() as { count: number }
    const expiring = db.prepare("SELECT COUNT(*) as count FROM films WHERE status = 'stored' AND storageEndDate <= ?").get(dayjs().add(7, 'day').format('YYYY-MM-DD')) as { count: number }
    const totalActive = db.prepare("SELECT COUNT(*) as count FROM films WHERE status NOT IN ('delivered', 'expired')").get() as { count: number }
    
    const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
    const todayProcessed = db.prepare('SELECT COUNT(*) as count FROM process_records WHERE timestamp >= ?').get(todayStart) as { count: number }

    const pendingList = db.prepare(`
      SELECT * FROM films 
      WHERE status IN ('registered', 'waiting_process') 
      ORDER BY isUrgent DESC, createdAt ASC 
      LIMIT 10
    `).all() as Film[]

    const rejectedList = db.prepare(`
      SELECT * FROM films 
      WHERE status = 'rework' 
      ORDER BY updatedAt DESC 
      LIMIT 10
    `).all() as Film[]

    const reworkList = db.prepare(`
      SELECT * FROM films 
      WHERE reworkCount > 0 
      ORDER BY reworkCount DESC, updatedAt DESC 
      LIMIT 10
    `).all() as Film[]

    const expiring7Days = db.prepare(`
      SELECT * FROM films 
      WHERE status = 'stored' AND storageEndDate <= ? 
      ORDER BY storageEndDate ASC 
      LIMIT 10
    `).all(dayjs().add(7, 'day').format('YYYY-MM-DD')) as Film[]

    const reworkCountResult = db.prepare("SELECT COUNT(*) as count FROM films WHERE reworkCount > 0").get() as { count: number }

    return {
      pendingCount: pending.count,
      rejectedCount: rejected.count,
      reworkCount: reworkCountResult.count,
      expiringCount: expiring.count,
      totalActive: totalActive.count,
      todayProcessed: todayProcessed.count,
      expiring7Days,
      pendingList,
      rejectedList,
      reworkList
    } as DashboardStats
  })

  ipcMain.handle('db:batch-import-films', async (_, films: any[]) => {
    const db = getDb()
    const now = getNow()
    const results = { success: 0, failed: 0, errors: [] as string[] }
    const insertStmt = db.prepare(`
      INSERT INTO films (memberId, memberName, filmNo, filmType, filmBrand, iso, format, shots, 
        processType, scanResolution, deliveryVersion, status, storageStartDate, storageEndDate, 
        isUrgent, remark, currentHandler, createdAt, updatedAt)
      VALUES (@memberId, @memberName, @filmNo, @filmType, @filmBrand, @iso, @format, @shots,
        @processType, @scanResolution, @deliveryVersion, @status, @storageStartDate, @storageEndDate,
        @isUrgent, @remark, @currentHandler, @now, @now)
    `)

    const transaction = db.transaction((batch: any[]) => {
      for (const data of batch) {
        try {
          const duplicate = db.prepare('SELECT COUNT(*) as count FROM films WHERE filmNo = ?').get(data.filmNo) as { count: number }
          if (duplicate.count > 0) {
            results.failed++
            results.errors.push(`第${data._row}: 胶卷编号 ${data.filmNo} 已存在`)
            continue
          }

          const member = db.prepare('SELECT id, name, storageMonths FROM members WHERE phone = ? OR name = ?').get(data.memberPhone, data.memberName) as any
          let memberId: number
          let memberName: string
          let storageMonths: number

          if (member) {
            memberId = member.id
            memberName = member.name
            storageMonths = member.storageMonths
          } else {
            const memberResult = db.prepare(`
              INSERT INTO members (name, phone, memberLevel, storageMonths, totalFilms, activeFilms, createdAt, updatedAt)
              VALUES (?, ?, 'normal', 6, 0, 0, ?, ?)
            `).run(data.memberName, data.memberPhone, now, now)
            memberId = memberResult.lastInsertRowid as number
            memberName = data.memberName
            storageMonths = 6
          }

          const storageStartDate = data.storageStartDate || dayjs().format('YYYY-MM-DD')
          const storageEndDate = data.storageEndDate || dayjs().add(storageMonths, 'month').format('YYYY-MM-DD')

          const filmData = {
            memberId,
            memberName,
            filmNo: data.filmNo,
            filmType: data.filmType,
            filmBrand: data.filmBrand,
            iso: data.iso,
            format: data.format,
            shots: parseInt(data.shots) || 36,
            processType: data.processType || 'C-41',
            scanResolution: data.scanResolution || '3000dpi',
            deliveryVersion: data.deliveryVersion || 'standard',
            status: 'registered',
            storageStartDate,
            storageEndDate,
            isUrgent: data.isUrgent ? 1 : 0,
            remark: data.remark,
            currentHandler: null,
            now
          }

          const result = insertStmt.run(filmData)
          const filmId = result.lastInsertRowid as number

          db.prepare('UPDATE members SET totalFilms = totalFilms + 1, activeFilms = activeFilms + 1 WHERE id = ?').run(memberId)

          db.prepare(`
            INSERT INTO process_records (filmId, filmNo, memberId, memberName, action, previousStatus, newStatus, operator, remark, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(filmId, data.filmNo, memberId, memberName, 'register', '-', 'registered', 'batch_import', '批量导入', now)

          db.prepare(`
            INSERT INTO reminders (type, filmId, filmNo, memberId, memberName, title, content, dueDate, priority, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run('pending', filmId, data.filmNo, memberId, memberName, '待分配冲扫员', '批量导入胶卷，等待分配', 
                 dayjs().add(2, 'day').format('YYYY-MM-DD'), 'medium', now)

          results.success++
        } catch (e: any) {
          results.failed++
          results.errors.push(`第${data._row}: ${e.message}`)
        }
      }
    })

    transaction(films)

    db.prepare('INSERT INTO audit_logs (action, module, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
      .run('batch_import', 'film', 'current_user', `批量导入: 成功${results.success}条, 失败${results.failed}条`, now)

    return results
  })

  ipcMain.handle('db:export-data', async (_, type: string) => {
    const db = getDb()
    const now = getNow()
    let data: any[]
    let filename: string

    if (type === 'films') {
      data = db.prepare('SELECT * FROM films ORDER BY createdAt DESC').all()
      filename = `胶卷数据_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    } else if (type === 'members') {
      data = db.prepare('SELECT * FROM members ORDER BY createdAt DESC').all()
      filename = `会员数据_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    } else if (type === 'process') {
      data = db.prepare('SELECT * FROM process_records ORDER BY timestamp DESC').all()
      filename = `处理记录_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    } else {
      throw new Error('未知的导出类型')
    }

    const csv = Papa.unparse(data)
    const downloadsPath = app.getPath('downloads')
    const filePath = path.join(downloadsPath, filename)
    fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf8')

    db.prepare('INSERT INTO audit_logs (action, module, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
      .run('export', type, 'current_user', `导出数据到: ${filePath}`, now)

    return filePath
  })

  ipcMain.handle('db:backup-database', async () => {
    const db = getDb()
    const now = getNow()
    const dbPath = getDbPath()
    const backupDir = path.join(app.getPath('userData'), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filename = `backup_${dayjs().format('YYYYMMDD_HHmmss')}.db`
    const backupPath = path.join(backupDir, filename)

    db.backup(backupPath)
      .then(() => {
        const currentDb = getDb()
        currentDb.prepare('INSERT INTO audit_logs (action, module, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
          .run('backup', 'database', 'current_user', `备份数据库到: ${backupPath}`, now)
      })

    return backupPath
  })

  ipcMain.handle('db:restore-database', async (_, filePath: string) => {
    if (!fs.existsSync(filePath)) {
      throw new Error('备份文件不存在')
    }

    const dbPath = getDbPath()
    const db = getDb()
    db.close()

    fs.copyFileSync(filePath, dbPath)

    const newDb = new Database(dbPath)
    newDb.pragma('journal_mode = WAL')
    newDb.pragma('foreign_keys = ON')
    setDb(newDb)

    newDb.prepare('INSERT INTO audit_logs (action, module, operator, detail, timestamp) VALUES (?, ?, ?, ?, ?)')
      .run('restore', 'database', 'current_user', `从备份恢复: ${filePath}`, getNow())

    return true
  })
}
