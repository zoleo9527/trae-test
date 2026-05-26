import type { User, Locker, Member, Course, Transaction, LockerAssignment, Appeal, AppealTimeline, PatrolPhoto, Coach, CourseEnrollment } from '@/types'

const db = window.db

export const dbApi = {
  async getUsers(): Promise<User[]> {
    return db.query('SELECT * FROM users ORDER BY id')
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const rows = await db.query('SELECT * FROM users WHERE username = ?', [username])
    return rows[0] || null
  },

  async getLockers(): Promise<Locker[]> {
    return db.query('SELECT * FROM lockers ORDER BY zone, locker_no')
  },

  async getLockersByStatus(status: Locker['status']): Promise<Locker[]> {
    return db.query('SELECT * FROM lockers WHERE status = ? ORDER BY zone, locker_no', [status])
  },

  async updateLockerStatus(id: number, status: Locker['status'], note?: string): Promise<void> {
    await db.run('UPDATE lockers SET status = ?, note = COALESCE(?, note) WHERE id = ?', [status, note || null, id])
  },

  async getMembers(): Promise<Member[]> {
    return db.query('SELECT * FROM members ORDER BY name')
  },

  async getMemberByNo(memberNo: string): Promise<Member | null> {
    const rows = await db.query('SELECT * FROM members WHERE member_no = ?', [memberNo])
    return rows[0] || null
  },

  async updateMemberBalance(memberId: number, delta: number, operatorId?: number, note?: string): Promise<number> {
    const member = await db.query('SELECT balance FROM members WHERE id = ?', [memberId])
    if (!member[0]) throw new Error('会员不存在')
    const newBalance = member[0].balance + delta
    await db.run('UPDATE members SET balance = ? WHERE id = ?', [newBalance, memberId])
    await db.run(
      `INSERT INTO transactions (member_id, type, amount, balance_after, operator_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [memberId, delta > 0 ? 'recharge' : 'consume', delta, newBalance, operatorId || null, note || null, Date.now()]
    )
    return newBalance
  },

  async getCoaches(): Promise<Coach[]> {
    return db.query('SELECT * FROM coaches ORDER BY name')
  },

  async getCourses(startTime?: number, endTime?: number): Promise<Course[]> {
    let sql = `
      SELECT c.*, co.name as coach_name
      FROM courses c
      LEFT JOIN coaches co ON c.coach_id = co.id
    `
    const params: any[] = []
    if (startTime && endTime) {
      sql += ' WHERE c.start_time >= ? AND c.start_time <= ?'
      params.push(startTime, endTime)
    }
    sql += ' ORDER BY c.start_time'
    return db.query(sql, params)
  },

  async getCourseEnrollments(courseId: number): Promise<CourseEnrollment[]> {
    return db.query(`
      SELECT ce.*, m.name as member_name, c.name as course_name
      FROM course_enrollments ce
      LEFT JOIN members m ON ce.member_id = m.id
      LEFT JOIN courses c ON ce.course_id = c.id
      WHERE ce.course_id = ?
      ORDER BY ce.created_at
    `, [courseId])
  },

  async getTransactions(memberId?: number): Promise<Transaction[]> {
    let sql = `
      SELECT t.*, m.name as member_name, u.name as operator_name
      FROM transactions t
      LEFT JOIN members m ON t.member_id = m.id
      LEFT JOIN users u ON t.operator_id = u.id
    `
    const params: any[] = []
    if (memberId) {
      sql += ' WHERE t.member_id = ?'
      params.push(memberId)
    }
    sql += ' ORDER BY t.created_at DESC LIMIT 100'
    return db.query(sql, params)
  },

  async getActiveLockerAssignments(): Promise<LockerAssignment[]> {
    return db.query(`
      SELECT la.*, l.locker_no, m.name as member_name, u.name as operator_name
      FROM locker_assignments la
      LEFT JOIN lockers l ON la.locker_id = l.id
      LEFT JOIN members m ON la.member_id = m.id
      LEFT JOIN users u ON la.operator_id = u.id
      WHERE la.status = 'active'
      ORDER BY la.assigned_at DESC
    `)
  },

  async assignLocker(lockerId: number, assignType: 'member' | 'guest' | 'temporary', operatorId: number, memberId?: number, guestName?: string, expiredAt?: number): Promise<number> {
    const now = Date.now()
    const result = await db.run(
      `INSERT INTO locker_assignments (locker_id, member_id, guest_name, assign_type, assigned_at, expired_at, operator_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [lockerId, memberId || null, guestName || null, assignType, now, expiredAt || null, operatorId, now]
    )
    await db.run('UPDATE lockers SET status = ? WHERE id = ?', ['occupied', lockerId])
    return result.lastInsertRowid
  },

  async releaseLocker(assignmentId: number): Promise<void> {
    const assignment = await db.query('SELECT locker_id FROM locker_assignments WHERE id = ?', [assignmentId])
    if (!assignment[0]) throw new Error('分配记录不存在')
    const now = Date.now()
    await db.run('UPDATE locker_assignments SET status = ?, released_at = ? WHERE id = ?', ['released', now, assignmentId])
    await db.run('UPDATE lockers SET status = ? WHERE id = ?', ['available', assignment[0].locker_id])
  },

  async getAppeals(status?: Appeal['status'], type?: Appeal['type']): Promise<Appeal[]> {
    let sql = `
      SELECT a.*,
             reporter.name as reporter_name,
             assignee.name as assignee_name,
             l.locker_no,
             c.name as course_name
      FROM appeals a
      LEFT JOIN users reporter ON a.reporter_id = reporter.id
      LEFT JOIN users assignee ON a.assignee_id = assignee.id
      LEFT JOIN lockers l ON a.related_locker_id = l.id
      LEFT JOIN courses c ON a.related_course_id = c.id
    `
    const params: any[] = []
    const where: string[] = []
    if (status) {
      where.push('a.status = ?')
      params.push(status)
    }
    if (type) {
      where.push('a.type = ?')
      params.push(type)
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY CASE a.priority WHEN "urgent" THEN 0 WHEN "high" THEN 1 WHEN "normal" THEN 2 ELSE 3 END, a.created_at DESC'
    return db.query(sql, params)
  },

  async getAppealById(id: number): Promise<Appeal | null> {
    const rows = await db.query(`
      SELECT a.*,
             reporter.name as reporter_name,
             assignee.name as assignee_name,
             l.locker_no,
             c.name as course_name
      FROM appeals a
      LEFT JOIN users reporter ON a.reporter_id = reporter.id
      LEFT JOIN users assignee ON a.assignee_id = assignee.id
      LEFT JOIN lockers l ON a.related_locker_id = l.id
      LEFT JOIN courses c ON a.related_course_id = c.id
      WHERE a.id = ?
    `, [id])
    return rows[0] || null
  },

  async getAppealTimeline(appealId: number): Promise<AppealTimeline[]> {
    return db.query(`
      SELECT at.*, u.name as actor_name
      FROM appeal_timeline at
      LEFT JOIN users u ON at.actor_id = u.id
      WHERE at.appeal_id = ?
      ORDER BY at.created_at
    `, [appealId])
  },

  async createAppeal(data: Partial<Appeal>, reporterId?: number): Promise<number> {
    const now = Date.now()
    const appealNo = `AP${now.toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    const result = await db.run(
      `INSERT INTO appeals (appeal_no, type, title, description, related_locker_id, related_course_id, related_transaction_id, reporter_id, status, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [appealNo, data.type, data.title, data.description, data.related_locker_id || null, data.related_course_id || null, data.related_transaction_id || null, reporterId || null, data.priority || 'normal', now, now]
    )
    await db.run(
      `INSERT INTO appeal_timeline (appeal_id, actor_id, action, note, created_at)
       VALUES (?, ?, '创建申诉', ?, ?)`,
      [result.lastInsertRowid, reporterId || null, data.description, now]
    )
    return result.lastInsertRowid
  },

  async updateAppealStatus(id: number, status: Appeal['status'], actorId?: number, note?: string): Promise<void> {
    const now = Date.now()
    await db.run('UPDATE appeals SET status = ?, updated_at = ? WHERE id = ?', [status, now, id])
    const actions: Record<string, string> = {
      investigating: '开始调查',
      resolved: '标记已解决',
      rejected: '驳回申诉',
      escalated: '升级申诉',
      pending: '重新打开'
    }
    await db.run(
      `INSERT INTO appeal_timeline (appeal_id, actor_id, action, note, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, actorId || null, actions[status] || '状态变更', note || null, now]
    )
  },

  async assignAppeal(id: number, assigneeId: number, actorId?: number): Promise<void> {
    const now = Date.now()
    const assignee = await db.query('SELECT name FROM users WHERE id = ?', [assigneeId])
    await db.run('UPDATE appeals SET assignee_id = ?, updated_at = ? WHERE id = ?', [assigneeId, now, id])
    await db.run(
      `INSERT INTO appeal_timeline (appeal_id, actor_id, action, note, created_at)
       VALUES (?, ?, '分配处理人', ?, ?)`,
      [id, actorId || null, `分配给 ${assignee[0]?.name || '未知用户'}`, now]
    )
  },

  async addAppealTimeline(appealId: number, action: string, note?: string, actorId?: number): Promise<void> {
    await db.run(
      `INSERT INTO appeal_timeline (appeal_id, actor_id, action, note, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [appealId, actorId || null, action, note || null, Date.now()]
    )
  },

  async getPatrolPhotos(): Promise<PatrolPhoto[]> {
    return db.query(`
      SELECT p.*, u.name as reporter_name
      FROM patrol_photos p
      LEFT JOIN users u ON p.reporter_id = u.id
      ORDER BY p.created_at DESC LIMIT 50
    `)
  },

  async createPatrolPhoto(data: Partial<PatrolPhoto>, reporterId?: number): Promise<number> {
    const result = await db.run(
      `INSERT INTO patrol_photos (photo_path, location, issue_type, description, reporter_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'reported', ?)`,
      [data.photo_path, data.location, data.issue_type || null, data.description || null, reporterId || null, Date.now()]
    )
    return result.lastInsertRowid
  },

  async getDashboardStats(): Promise<{
    activeLockers: number
    availableLockers: number
    todayCourses: number
    pendingAppeals: number
    urgentAppeals: number
    totalMembers: number
  }> {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM lockers WHERE status = 'occupied') as activeLockers,
        (SELECT COUNT(*) FROM lockers WHERE status = 'available') as availableLockers,
        (SELECT COUNT(*) FROM courses WHERE DATE(start_time / 1000, 'unixepoch') = DATE('now')) as todayCourses,
        (SELECT COUNT(*) FROM appeals WHERE status = 'pending') as pendingAppeals,
        (SELECT COUNT(*) FROM appeals WHERE priority = 'urgent' AND status IN ('pending', 'investigating')) as urgentAppeals,
        (SELECT COUNT(*) FROM members WHERE status = 'active') as totalMembers
    `)
    return result[0]
  }
}

export default dbApi
