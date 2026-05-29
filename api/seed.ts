import { v4 as uuidv4 } from 'uuid'
import { getDb, clearDatabase } from './db.js'

export function seedDatabase(): void {
  const db = getDb()

  const rollCount = (db.prepare('SELECT COUNT(*) as count FROM film_rolls').get() as { count: number }).count
  if (rollCount > 0) {
    console.log('Data already exists, skipping seed')
    return
  }

  const seedAll = db.transaction(() => {
    const now = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const formatDateTime = (d: Date) => d.toISOString()

    const addDays = (d: Date, days: number) => {
      const result = new Date(d)
      result.setDate(result.getDate() + days)
      return result
    }

    const rolls = [
      {
        id: 'roll-001',
        roll_number: 'A-2024-001',
        customer_name: '张伟',
        customer_contact: '138-0001-0001',
        film_type: 'Kodak Gold 200 彩色负片',
        scan_spec: '标准扫描 3000x2000',
        status: 'completed',
        registered_at: formatDateTime(addDays(now, -19)),
        due_date: formatDate(addDays(now, -13)),
        assignee_id: 'staff-dev',
        notes: '冲扫参数: C-41工艺+标准扫描',
        actions: [
          { action_type: 'register', operator_id: 'staff-cs', operator_role: 'cs', detail: '胶卷登记入库', daysOffset: -19 },
          { action_type: 'develop', operator_id: 'staff-dev', operator_role: 'developer', detail: '开始冲扫', daysOffset: -18 },
          { action_type: 'qc_pass', operator_id: 'staff-owner', operator_role: 'owner', detail: '质检通过，色彩还原准确', daysOffset: -17 },
          { action_type: 'confirm_request', operator_id: 'staff-cs', operator_role: 'cs', detail: '发起客户确认，已发送预览图', daysOffset: -16 },
          { action_type: 'confirm_ok', operator_id: 'staff-cs', operator_role: 'cs', detail: '客户满意，确认完成', daysOffset: -15 },
        ],
      },
      {
        id: 'roll-002',
        roll_number: 'A-2024-002',
        customer_name: '刘芳',
        customer_contact: '138-0002-0002',
        film_type: 'Fujifilm Superia 400 彩色负片',
        scan_spec: '标准扫描 3000x2000',
        status: 'developing',
        registered_at: formatDateTime(addDays(now, -3)),
        due_date: formatDate(addDays(now, 3)),
        assignee_id: 'staff-dev',
        notes: '冲扫参数: C-41工艺+标准扫描',
        actions: [
          { action_type: 'register', operator_id: 'staff-cs', operator_role: 'cs', detail: '胶卷登记入库', daysOffset: -3 },
          { action_type: 'develop', operator_id: 'staff-dev', operator_role: 'developer', detail: '开始冲扫', daysOffset: -2 },
        ],
      },
      {
        id: 'roll-003',
        roll_number: 'A-2024-003',
        customer_name: '赵敏',
        customer_contact: '138-0003-0003',
        film_type: 'Kodak Portra 400 专业负片',
        scan_spec: '高分辨率扫描 6000x4000',
        status: 'reworking',
        registered_at: formatDateTime(addDays(now, -9)),
        due_date: formatDate(addDays(now, -3)),
        assignee_id: 'staff-dev',
        notes: '冲扫参数: C-41工艺+高分辨率扫描',
        actions: [
          { action_type: 'register', operator_id: 'staff-cs', operator_role: 'cs', detail: '胶卷登记入库', daysOffset: -9 },
          { action_type: 'develop', operator_id: 'staff-dev', operator_role: 'developer', detail: '开始冲扫', daysOffset: -8 },
          { action_type: 'qc_fail', operator_id: 'staff-owner', operator_role: 'owner', detail: '发现色偏问题，整体偏绿', daysOffset: -7 },
          { action_type: 'rework_decide', operator_id: 'staff-owner', operator_role: 'owner', detail: '店主决定返工重新冲扫', daysOffset: -7 },
        ],
        qc: { result: 'fail', issue_desc: '整体偏绿，药水温度异常偏高导致色彩偏移', impact_scope: '整卷 36 张全部受影响', operator_id: 'staff-owner', daysOffset: -7 },
        reworkDecision: { decision: 'rework', reason: '药水温度记录显示高出 2 度，责任在我方，免费返工', decided_by: 'staff-owner', daysOffset: -7 },
      },
      {
        id: 'roll-004',
        roll_number: 'A-2024-004',
        customer_name: '孙强',
        customer_contact: '138-0004-0004',
        film_type: 'Ilford HP5 Plus 400 黑白负片',
        scan_spec: '标准扫描 3000x2000',
        status: 'confirming',
        registered_at: formatDateTime(addDays(now, -7)),
        due_date: formatDate(addDays(now, -1)),
        assignee_id: 'staff-dev',
        notes: '冲扫参数: D-76工艺+标准扫描',
        actions: [
          { action_type: 'register', operator_id: 'staff-cs', operator_role: 'cs', detail: '胶卷登记入库', daysOffset: -7 },
          { action_type: 'develop', operator_id: 'staff-dev', operator_role: 'developer', detail: '开始冲扫', daysOffset: -6 },
          { action_type: 'qc_pass', operator_id: 'staff-owner', operator_role: 'owner', detail: '质检通过，黑白对比度好', daysOffset: -5 },
          { action_type: 'confirm_request', operator_id: 'staff-cs', operator_role: 'cs', detail: '发起客户确认，已发送网盘链接', daysOffset: -4 },
        ],
        qc: { result: 'pass', issue_desc: '', impact_scope: '', operator_id: 'staff-owner', daysOffset: -5 },
        confirmRequest: { delivery_desc: '黑白 36 张扫描完成，已上传百度网盘', operator_id: 'staff-cs', daysOffset: -4 },
      },
      {
        id: 'roll-005',
        roll_number: 'A-2024-005',
        customer_name: '周静',
        customer_contact: '138-0005-0005',
        film_type: 'Kodak Ektar 100 彩色负片',
        scan_spec: '高分辨率扫描 6000x4000',
        status: 'compensating',
        registered_at: formatDateTime(addDays(now, -11)),
        due_date: formatDate(addDays(now, -5)),
        assignee_id: 'staff-dev',
        notes: '冲扫参数: C-41工艺+高分辨率扫描',
        actions: [
          { action_type: 'register', operator_id: 'staff-cs', operator_role: 'cs', detail: '胶卷登记入库', daysOffset: -11 },
          { action_type: 'develop', operator_id: 'staff-dev', operator_role: 'developer', detail: '开始冲扫', daysOffset: -10 },
          { action_type: 'qc_pass', operator_id: 'staff-owner', operator_role: 'owner', detail: '质检通过', daysOffset: -9 },
          { action_type: 'confirm_request', operator_id: 'staff-cs', operator_role: 'cs', detail: '发起客户确认', daysOffset: -8 },
          { action_type: 'confirm_compensate', operator_id: 'staff-cs', operator_role: 'cs', detail: '客户反馈有划痕，要求赔付', daysOffset: -6 },
        ],
        qc: { result: 'pass', issue_desc: '', impact_scope: '', operator_id: 'staff-owner', daysOffset: -9 },
        confirmRequest: { delivery_desc: '高分辨率扫描完成', operator_id: 'staff-cs', daysOffset: -8 },
        confirmResult: { result: 'compensation', feedback: '第 15-20 张有明显划痕，要求赔付', operator_id: 'staff-cs', daysOffset: -6 },
      },
      {
        id: 'roll-006',
        roll_number: 'A-2024-006',
        customer_name: '吴磊',
        customer_contact: '138-0006-0006',
        film_type: 'Fujifilm Pro 400H 彩色负片',
        scan_spec: '高分辨率扫描 6000x4000',
        status: 'completed',
        registered_at: formatDateTime(addDays(now, -17)),
        due_date: formatDate(addDays(now, -11)),
        assignee_id: 'staff-dev',
        notes: '冲扫参数: C-41工艺+高分辨率扫描',
        actions: [
          { action_type: 'register', operator_id: 'staff-cs', operator_role: 'cs', detail: '胶卷登记入库', daysOffset: -17 },
          { action_type: 'develop', operator_id: 'staff-dev', operator_role: 'developer', detail: '开始冲扫', daysOffset: -16 },
          { action_type: 'qc_fail', operator_id: 'staff-owner', operator_role: 'owner', detail: '发现混号问题，第 20-25 张不是客户的', daysOffset: -15 },
          { action_type: 'rework_decide', operator_id: 'staff-owner', operator_role: 'owner', detail: '店主决定返工，确认是混号问题', daysOffset: -15 },
          { action_type: 'rework_execute', operator_id: 'staff-dev', operator_role: 'developer', detail: '重新查找并扫描正确的底片', daysOffset: -14 },
          { action_type: 'recheck_pass', operator_id: 'staff-owner', operator_role: 'owner', detail: '复检通过，已确认是正确的底片', daysOffset: -13 },
          { action_type: 'confirm_request', operator_id: 'staff-cs', operator_role: 'cs', detail: '发起客户确认，说明混号问题并致歉', daysOffset: -12 },
          { action_type: 'confirm_ok', operator_id: 'staff-cs', operator_role: 'cs', detail: '客户表示理解，确认完成', daysOffset: -11 },
        ],
        qc: { result: 'fail', issue_desc: '混号问题，第 20-25 张内容与客户描述不符', impact_scope: '部分（6 张）', operator_id: 'staff-owner', daysOffset: -15 },
        reworkDecision: { decision: 'rework', reason: '混号问题，责任在我方，重新查找正确底片', decided_by: 'staff-owner', daysOffset: -15 },
        reworkExecution: { action_detail: '重新核对登记记录，找到正确的底片并重新扫描', result: 'completed', operator_id: 'staff-dev', daysOffset: -14 },
        recheck: { result: 'pass', note: '已确认是正确底片，内容与客户描述一致', checked_by: 'staff-owner', daysOffset: -13 },
        confirmRequest: { delivery_desc: '重新扫描完成，混号问题已解决，附送小礼品致歉', operator_id: 'staff-cs', daysOffset: -12 },
        confirmResult: { result: 'satisfied', feedback: '理解并接受致歉，处理态度很好', operator_id: 'staff-cs', daysOffset: -11 },
      },
    ]

    const insertRoll = db.prepare(`
      INSERT INTO film_rolls (id, roll_number, customer_name, customer_contact, film_type, scan_spec, status, registered_at, due_date, assignee_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertAction = db.prepare(`
      INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertQc = db.prepare(`
      INSERT INTO qc_records (id, roll_id, result, issue_desc, impact_scope, operator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertReworkDecision = db.prepare(`
      INSERT INTO rework_decisions (id, qc_id, roll_id, decision, reason, decided_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertReworkExecution = db.prepare(`
      INSERT INTO rework_executions (id, decision_id, roll_id, action_detail, result, operator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertRecheck = db.prepare(`
      INSERT INTO recheck_records (id, execution_id, roll_id, result, note, checked_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertConfirmRequest = db.prepare(`
      INSERT INTO confirm_requests (id, roll_id, delivery_desc, operator_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertConfirmResult = db.prepare(`
      INSERT INTO confirm_results (id, request_id, roll_id, result, feedback, operator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    rolls.forEach(roll => {
      insertRoll.run(roll.id, roll.roll_number, roll.customer_name, roll.customer_contact, roll.film_type, roll.scan_spec, roll.status, roll.registered_at, roll.due_date, roll.assignee_id, roll.notes)

      roll.actions.forEach(action => {
        const actionDate = formatDateTime(addDays(now, action.daysOffset))
        insertAction.run(uuidv4(), roll.id, action.action_type, action.operator_id, action.operator_role, action.detail, actionDate)
      })

      if (roll.qc) {
        const qcId = uuidv4()
        const qcDate = formatDateTime(addDays(now, roll.qc.daysOffset))
        insertQc.run(qcId, roll.id, roll.qc.result, roll.qc.issue_desc, roll.qc.impact_scope, roll.qc.operator_id, qcDate)

        if (roll.reworkDecision) {
          const decisionId = uuidv4()
          const decisionDate = formatDateTime(addDays(now, roll.reworkDecision.daysOffset))
          insertReworkDecision.run(decisionId, qcId, roll.id, roll.reworkDecision.decision, roll.reworkDecision.reason, roll.reworkDecision.decided_by, decisionDate)

          if (roll.reworkExecution) {
            const executionId = uuidv4()
            const executionDate = formatDateTime(addDays(now, roll.reworkExecution.daysOffset))
            insertReworkExecution.run(executionId, decisionId, roll.id, roll.reworkExecution.action_detail, roll.reworkExecution.result, roll.reworkExecution.operator_id, executionDate)

            if (roll.recheck) {
              const recheckDate = formatDateTime(addDays(now, roll.recheck.daysOffset))
              insertRecheck.run(uuidv4(), executionId, roll.id, roll.recheck.result, roll.recheck.note, roll.recheck.checked_by, recheckDate)
            }
          }
        }
      }

      if (roll.confirmRequest) {
        const requestId = uuidv4()
        const requestDate = formatDateTime(addDays(now, roll.confirmRequest.daysOffset))
        insertConfirmRequest.run(requestId, roll.id, roll.confirmRequest.delivery_desc, roll.confirmRequest.operator_id, requestDate)

        if (roll.confirmResult) {
          const resultDate = formatDateTime(addDays(now, roll.confirmResult.daysOffset))
          insertConfirmResult.run(uuidv4(), requestId, roll.id, roll.confirmResult.result, roll.confirmResult.feedback, roll.confirmResult.operator_id, resultDate)
        }
      }
    })
  })

  seedAll()
  console.log('Seed data inserted: 6 rolls')
}
