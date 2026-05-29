import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

export function initDb(): Database.Database {
  const dataDir = path.resolve(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.resolve(dataDir, 'nursery.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS plots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      species TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '在养',
      responsible_person TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plot_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plot_id INTEGER NOT NULL,
      species TEXT NOT NULL,
      total_count INTEGER NOT NULL DEFAULT 0,
      available_count INTEGER NOT NULL DEFAULT 0,
      reserved_count INTEGER NOT NULL DEFAULT 0,
      transferred_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (plot_id) REFERENCES plots(id)
    );

    CREATE TABLE IF NOT EXISTS plot_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plot_id INTEGER NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      reason TEXT,
      operator TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (plot_id) REFERENCES plots(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plot_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      species TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT '待审批',
      created_by TEXT NOT NULL,
      approved_by TEXT,
      expected_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (plot_id) REFERENCES plots(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '备注',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS loading_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL,
      vehicle_no TEXT,
      driver_name TEXT,
      status TEXT NOT NULL DEFAULT '待装车',
      loaded_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS loading_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loading_order_id INTEGER NOT NULL,
      species TEXT NOT NULL,
      planned_qty INTEGER NOT NULL DEFAULT 0,
      actual_qty INTEGER NOT NULL DEFAULT 0,
      difference_reason TEXT,
      FOREIGN KEY (loading_order_id) REFERENCES loading_orders(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plot_id INTEGER NOT NULL,
      transfer_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待处理',
      assignee TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT '普通',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (plot_id) REFERENCES plots(id),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS task_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS disease_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      plot_id INTEGER NOT NULL,
      disease_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT '轻度',
      description TEXT,
      reported_by TEXT NOT NULL,
      reported_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT '待确认',
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (plot_id) REFERENCES plots(id)
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      contact_result TEXT,
      satisfaction TEXT,
      issue_description TEXT,
      followup_by TEXT NOT NULL,
      followup_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT '待回访',
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followup_id INTEGER,
      disease_report_id INTEGER,
      type TEXT NOT NULL DEFAULT '补苗协商',
      status TEXT NOT NULL DEFAULT '协商中',
      result TEXT,
      negotiated_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (followup_id) REFERENCES followups(id),
      FOREIGN KEY (disease_report_id) REFERENCES disease_reports(id)
    );

    CREATE TABLE IF NOT EXISTS negotiation_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      negotiation_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (negotiation_id) REFERENCES negotiations(id)
    );
  `)

  console.log('Database initialized at:', dbPath)
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function seedDb(): void {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM plots').get() as { count: number }
  if (count.count > 0) {
    console.log('Database already seeded, skipping...')
    return
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const yesterday = new Date(Date.now() - 86400000).toISOString().replace('T', ' ').substring(0, 19)
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().replace('T', ' ').substring(0, 19)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().replace('T', ' ').substring(0, 19)
  const nextWeek = new Date(Date.now() + 604800000).toISOString().replace('T', ' ').substring(0, 19)

  const insertPlot = db.prepare(`
    INSERT INTO plots (name, area, species, status, responsible_person, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertInventory = db.prepare(`
    INSERT INTO plot_inventory (plot_id, species, total_count, available_count, reserved_count, transferred_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertStatusLog = db.prepare(`
    INSERT INTO plot_status_log (plot_id, from_status, to_status, reason, operator, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTransfer = db.prepare(`
    INSERT INTO transfers (plot_id, customer_name, species, quantity, status, created_by, approved_by, expected_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTransferNote = db.prepare(`
    INSERT INTO transfer_notes (transfer_id, content, author, type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertTask = db.prepare(`
    INSERT INTO tasks (plot_id, transfer_id, type, title, status, assignee, priority, due_date, completed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTaskNote = db.prepare(`
    INSERT INTO task_notes (task_id, content, author, created_at)
    VALUES (?, ?, ?, ?)
  `)

  const insertDisease = db.prepare(`
    INSERT INTO disease_reports (task_id, plot_id, disease_type, severity, description, reported_by, reported_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLoading = db.prepare(`
    INSERT INTO loading_orders (transfer_id, vehicle_no, driver_name, status, loaded_at, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLoadingItem = db.prepare(`
    INSERT INTO loading_items (loading_order_id, species, planned_qty, actual_qty, difference_reason)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertFollowup = db.prepare(`
    INSERT INTO followups (transfer_id, customer_name, contact_result, satisfaction, issue_description, followup_by, followup_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertNegotiation = db.prepare(`
    INSERT INTO negotiations (followup_id, disease_report_id, type, status, result, negotiated_by, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertNegotiationNote = db.prepare(`
    INSERT INTO negotiation_notes (negotiation_id, content, author, created_at)
    VALUES (?, ?, ?, ?)
  `)

  const plot1 = insertPlot.run('A1地块', '5亩', '红枫', '在养', '李养护', twoDaysAgo, now)
  const plot2 = insertPlot.run('A2地块', '3亩', '紫薇', '在养', '李养护', twoDaysAgo, now)
  const plot3 = insertPlot.run('B1地块', '8亩', '香樟', '待起苗', '王养护', twoDaysAgo, now)
  const plot4 = insertPlot.run('B2地块', '4亩', '桂花', '部分起苗', '王养护', twoDaysAgo, now)
  const plot5 = insertPlot.run('C1地块', '6亩', '樱花', '空床', '张养护', twoDaysAgo, now)

  insertInventory.run(plot1.lastInsertRowid, '红枫', 500, 500, 0, 0)
  insertInventory.run(plot2.lastInsertRowid, '紫薇', 800, 800, 0, 0)
  insertInventory.run(plot3.lastInsertRowid, '香樟', 300, 100, 200, 0)
  insertInventory.run(plot4.lastInsertRowid, '桂花', 400, 250, 0, 150)
  insertInventory.run(plot5.lastInsertRowid, '樱花', 0, 0, 0, 0)

  insertStatusLog.run(plot3.lastInsertRowid, '在养', '待起苗', '调拨单审批通过', '张主任', '客户要求下周三前起苗完成', twoDaysAgo)
  insertStatusLog.run(plot4.lastInsertRowid, '在养', '部分起苗', '开始起苗作业', '李养护', '昨天已起苗150棵发往上海', yesterday)
  insertStatusLog.run(plot5.lastInsertRowid, '在养', '空床', '上批次已全部出圃', '张主任', '已完成清床和消毒，等待下一批种植', twoDaysAgo)

  const transfer1 = insertTransfer.run(plot3.lastInsertRowid, '上海绿源园林', '香樟', 200, '待装车', '陈销售', '张主任', tomorrow, twoDaysAgo, yesterday)
  const transfer2 = insertTransfer.run(plot4.lastInsertRowid, '杭州美景市政', '桂花', 150, '运输中', '陈销售', '张主任', twoDaysAgo, twoDaysAgo, yesterday)
  const transfer3 = insertTransfer.run(plot1.lastInsertRowid, '南京绿园工程', '红枫', 100, '待审批', '刘销售', null, nextWeek, yesterday, yesterday)
  const transfer4 = insertTransfer.run(plot2.lastInsertRowid, '合肥城市绿化', '紫薇', 300, '已完成', '刘销售', '张主任', threeDaysAgo(), fourDaysAgo(), twoDaysAgo)

  insertTransferNote.run(transfer1.lastInsertRowid, '客户要求每棵树带土球直径80cm以上', '陈销售', '备注', twoDaysAgo)
  insertTransferNote.run(transfer2.lastInsertRowid, '昨天发车，预计今天下午到达', '李养护', '物流', yesterday)
  insertTransferNote.run(transfer4.lastInsertRowid, '客户已确认收货，数量质量均合格', '陈销售', '确认', twoDaysAgo)

  const task1 = insertTask.run(plot3.lastInsertRowid, transfer1.lastInsertRowid, '起苗', '香樟起苗任务', '待处理', '王养护', '高', tomorrow, null, twoDaysAgo)
  const task2 = insertTask.run(plot4.lastInsertRowid, transfer2.lastInsertRowid, '起苗', '桂花起苗任务', '已完成', '王养护', '高', twoDaysAgo, yesterday, twoDaysAgo)
  const task3 = insertTask.run(plot1.lastInsertRowid, null, '养护', '红枫春季施肥', '进行中', '李养护', '普通', tomorrow, null, yesterday)
  const task4 = insertTask.run(plot2.lastInsertRowid, null, '病害', '紫薇褐斑病防治', '待处理', '李养护', '高', yesterday, null, threeDaysAgo())
  const task5 = insertTask.run(plot5.lastInsertRowid, null, '养护', '地块消毒', '待处理', '张养护', '普通', nextWeek, null, yesterday)

  insertTaskNote.run(task4.lastInsertRowid, '发现约50棵紫薇叶片有褐色斑点，疑似褐斑病', '李养护', threeDaysAgo())
  insertTaskNote.run(task2.lastInsertRowid, '150棵桂花已全部起苗完毕，土球完整', '王养护', yesterday)

  const disease1 = insertDisease.run(task4.lastInsertRowid, plot2.lastInsertRowid, '褐斑病', '中度', '叶片出现褐色圆形斑点，边缘有黄色晕圈，约50棵发病', '李养护', threeDaysAgo(), '待确认')

  const loading1 = insertLoading.run(transfer2.lastInsertRowid, '沪A12345', '王师傅', '已完成', yesterday, '张调度', twoDaysAgo)
  const loading2 = insertLoading.run(transfer1.lastInsertRowid, null, null, '待装车', null, '张调度', yesterday)

  insertLoadingItem.run(loading1.lastInsertRowid, '桂花', 150, 145, '装车时发现5棵土球破损，已更换')
  insertLoadingItem.run(loading2.lastInsertRowid, '香樟', 200, 0, null)

  const followup1 = insertFollowup.run(transfer2.lastInsertRowid, '杭州美景市政', '电话联系上，客户反馈已收到货', '一般', '客户说有2棵树叶子有点蔫，担心存活率', '陈销售', yesterday, '待跟进')
  const followup2 = insertFollowup.run(transfer4.lastInsertRowid, '合肥城市绿化', '电话确认收货', '满意', '客户对质量很满意，下月还有订单', '刘销售', twoDaysAgo, '已完成')
  const followup3 = insertFollowup.run(transfer1.lastInsertRowid, '上海绿源园林', null, null, null, '陈销售', tomorrow, '待回访')

  const negotiation1 = insertNegotiation.run(followup1.lastInsertRowid, null, '补苗协商', '协商中', null, '张主任', yesterday, null)
  const negotiation2 = insertNegotiation.run(null, disease1.lastInsertRowid, '病害赔偿', '协商中', null, '张主任', threeDaysAgo(), null)

  insertNegotiationNote.run(negotiation1.lastInsertRowid, '客户要求对2棵蔫苗进行补苗或退款50%', '陈销售', yesterday)
  insertNegotiationNote.run(negotiation1.lastInsertRowid, '建议先观察一周，确认是否真的死亡，再商量处理方案', '张主任', yesterday)
  insertNegotiationNote.run(negotiation2.lastInsertRowid, '采购的苗木可能携带病菌，已联系供应商', '张主任', threeDaysAgo())
  insertNegotiationNote.run(negotiation2.lastInsertRowid, '供应商同意派技术人员过来查看，明天到', '李养护', twoDaysAgo)

  console.log('Database seeded successfully with demo data!')
}

function threeDaysAgo(): string {
  return new Date(Date.now() - 259200000).toISOString().replace('T', ' ').substring(0, 19)
}

function fourDaysAgo(): string {
  return new Date(Date.now() - 345600000).toISOString().replace('T', ' ').substring(0, 19)
}
