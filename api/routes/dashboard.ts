import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/stats', (req: Request, res: Response) => {
  const db = getDb()

  const totalPlots = (db.prepare('SELECT COUNT(*) as c FROM plots').get() as { c: number }).c
  const activePlots = (db.prepare("SELECT COUNT(*) as c FROM plots WHERE status = '在养'").get() as { c: number }).c
  const pendingTransfers = (db.prepare("SELECT COUNT(*) as c FROM transfers WHERE status = '待审批'").get() as { c: number }).c
  const pendingTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status IN ('待处理', '进行中')").get() as { c: number }).c

  res.json({
    total_plots: totalPlots,
    active_plots: activePlots,
    pending_transfers: pendingTransfers,
    pending_tasks: pendingTasks,
  })
})

router.get('/alerts', (req: Request, res: Response) => {
  const db = getDb()
  const alerts: Array<{
    id: number
    type: string
    title: string
    urgency: 'red' | 'amber' | 'gray'
    link: string
    created_at: string
  }> = []

  const diseaseReports = db.prepare(`
    SELECT dr.*, p.name as plot_name
    FROM disease_reports dr
    LEFT JOIN plots p ON dr.plot_id = p.id
    WHERE dr.status IN ('待确认', '处理中')
    ORDER BY dr.reported_at DESC
  `).all() as Array<{ id: number; disease_type: string; severity: string; plot_name: string; reported_at: string; status: string }>

  for (const dr of diseaseReports) {
    const urgency = dr.severity === '重度' ? 'red' : dr.severity === '中度' ? 'amber' : 'gray'
    alerts.push({
      id: dr.id,
      type: '病害上报',
      title: `${dr.plot_name} ${dr.disease_type}${dr.status === '待确认' ? ' 待确认' : ' 处理中'}`,
      urgency,
      link: '/operations?tab=disease',
      created_at: dr.reported_at,
    })
  }

  const loadingOrders = db.prepare(`
    SELECT lo.*, t.customer_name, t.quantity
    FROM loading_orders lo
    LEFT JOIN transfers t ON lo.transfer_id = t.id
    WHERE lo.status = '待装车'
    ORDER BY lo.created_at DESC
  `).all() as Array<{ id: number; customer_name: string; created_at: string }>

  for (const lo of loadingOrders) {
    alerts.push({
      id: 1000 + lo.id,
      type: '装车待处理',
      title: `${lo.customer_name} 装车单待处理`,
      urgency: 'amber',
      link: `/loading/${lo.id}`,
      created_at: lo.created_at,
    })
  }

  const loadingDiscrepancies = db.prepare(`
    SELECT li.*, lo.transfer_id, t.customer_name
    FROM loading_items li
    LEFT JOIN loading_orders lo ON li.loading_order_id = lo.id
    LEFT JOIN transfers t ON lo.transfer_id = t.id
    WHERE li.actual_qty > 0 AND li.actual_qty != li.planned_qty
    ORDER BY lo.created_at DESC
  `).all() as Array<{ id: number; species: string; planned_qty: number; actual_qty: number; customer_name: string; transfer_id: number }>

  for (const li of loadingDiscrepancies) {
    const diff = li.planned_qty - li.actual_qty
    alerts.push({
      id: 2000 + li.id,
      type: '装车数量差异',
      title: `${li.customer_name} ${li.species} 差异${diff > 0 ? `少${diff}` : `多${-diff}`}株`,
      urgency: 'red',
      link: `/transfers/${li.transfer_id}`,
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    })
  }

  const pendingFollowups = db.prepare(`
    SELECT f.*, t.customer_name
    FROM followups f
    LEFT JOIN transfers t ON f.transfer_id = t.id
    WHERE f.status = '待回访'
    ORDER BY f.followup_at ASC
  `).all() as Array<{ id: number; customer_name: string; followup_at: string; issue_description: string }>

  for (const f of pendingFollowups) {
    const dueDate = dayjs(f.followup_at)
    const today = dayjs()
    const isOverdue = dueDate.isBefore(today, 'day')
    alerts.push({
      id: 3000 + f.id,
      type: '待回访',
      title: `${f.customer_name} ${f.issue_description || '待回访'}`,
      urgency: isOverdue ? 'red' : 'amber',
      link: '/followup',
      created_at: f.followup_at,
    })
  }

  const pendingNegotiations = db.prepare(`
    SELECT n.*, f.customer_name
    FROM negotiations n
    LEFT JOIN followups f ON n.followup_id = f.id
    WHERE n.status = '协商中'
    ORDER BY n.created_at DESC
  `).all() as Array<{ id: number; type: string; customer_name: string; created_at: string }>

  for (const n of pendingNegotiations) {
    alerts.push({
      id: 4000 + n.id,
      type: n.type,
      title: `${n.customer_name || '客户'} ${n.type}待处理`,
      urgency: 'red',
      link: '/followup',
      created_at: n.created_at,
    })
  }

  const overdueTasks = db.prepare(`
    SELECT t.*, p.name as plot_name
    FROM tasks t
    LEFT JOIN plots p ON t.plot_id = p.id
    WHERE t.status IN ('待处理', '进行中') AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC
  `).all() as Array<{ id: number; title: string; priority: string; due_date: string; plot_name: string; type: string }>

  for (const t of overdueTasks) {
    const dueDate = dayjs(t.due_date)
    const today = dayjs()
    const daysDiff = dueDate.diff(today, 'day')
    if (daysDiff < 0) {
      alerts.push({
        id: 5000 + t.id,
        type: '任务超时',
        title: `${t.plot_name} ${t.title} 已超时${-daysDiff}天`,
        urgency: 'red',
        link: '/operations',
        created_at: t.due_date,
      })
    } else if (daysDiff <= 2) {
      alerts.push({
        id: 5000 + t.id,
        type: '任务即将到期',
        title: `${t.plot_name} ${t.title} 还有${daysDiff}天到期`,
        urgency: 'amber',
        link: '/operations',
        created_at: t.due_date,
      })
    }
  }

  alerts.sort((a, b) => {
    const urgencyOrder = { red: 0, amber: 1, gray: 2 }
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  })

  res.json(alerts.slice(0, 10))
})

router.get('/activities', (req: Request, res: Response) => {
  const db = getDb()
  const activities: Array<{
    id: number
    type: string
    action: string
    actor: string
    timestamp: string
  }> = []

  const transferNotes = db.prepare(`
    SELECT tn.*, t.customer_name
    FROM transfer_notes tn
    LEFT JOIN transfers t ON tn.transfer_id = t.id
    ORDER BY tn.created_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; content: string; author: string; type: string; created_at: string; customer_name: string; transfer_id: number }>

  for (const tn of transferNotes) {
    const typeMap: Record<string, string> = {
      '审批': 'transfer',
      '备注': 'transfer',
      'comment': 'transfer',
    }
    activities.push({
      id: 10000 + tn.id,
      type: typeMap[tn.type] || 'transfer',
      action: `${tn.author} ${tn.type === '审批' ? '审批了' : '评论了'} ${tn.customer_name}的调拨单：${tn.content}`,
      actor: tn.author,
      timestamp: dayjs(tn.created_at).format('MM-DD HH:mm'),
    })
  }

  const taskNotes = db.prepare(`
    SELECT tn.*, t.title as task_title
    FROM task_notes tn
    LEFT JOIN tasks t ON tn.task_id = t.id
    ORDER BY tn.created_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; content: string; author: string; created_at: string; task_title: string }>

  for (const tn of taskNotes) {
    activities.push({
      id: 20000 + tn.id,
      type: 'task',
      action: `${tn.author} 更新了任务「${tn.task_title}」：${tn.content}`,
      actor: tn.author,
      timestamp: dayjs(tn.created_at).format('MM-DD HH:mm'),
    })
  }

  const plotStatusLogs = db.prepare(`
    SELECT psl.*, p.name as plot_name
    FROM plot_status_log psl
    LEFT JOIN plots p ON psl.plot_id = p.id
    ORDER BY psl.created_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; from_status: string; to_status: string; operator: string; note: string; created_at: string; plot_name: string }>

  for (const psl of plotStatusLogs) {
    activities.push({
      id: 30000 + psl.id,
      type: 'task',
      action: `${psl.operator} 将 ${psl.plot_name} 从「${psl.from_status}」改为「${psl.to_status}」${psl.note ? `：${psl.note}` : ''}`,
      actor: psl.operator,
      timestamp: dayjs(psl.created_at).format('MM-DD HH:mm'),
    })
  }

  const diseaseReports = db.prepare(`
    SELECT dr.*, p.name as plot_name
    FROM disease_reports dr
    LEFT JOIN plots p ON dr.plot_id = p.id
    ORDER BY dr.reported_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; disease_type: string; severity: string; reported_by: string; reported_at: string; plot_name: string }>

  for (const dr of diseaseReports) {
    activities.push({
      id: 40000 + dr.id,
      type: 'disease',
      action: `${dr.reported_by} 上报 ${dr.plot_name} ${dr.severity}${dr.disease_type}`,
      actor: dr.reported_by,
      timestamp: dayjs(dr.reported_at).format('MM-DD HH:mm'),
    })
  }

  const loadingOrders = db.prepare(`
    SELECT lo.*, t.customer_name
    FROM loading_orders lo
    LEFT JOIN transfers t ON lo.transfer_id = t.id
    ORDER BY lo.created_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; status: string; created_by: string; created_at: string; customer_name: string }>

  for (const lo of loadingOrders) {
    const statusText = lo.status === '已完成' ? '完成了' : lo.status === '装车中' ? '开始' : '创建了'
    activities.push({
      id: 50000 + lo.id,
      type: 'loading',
      action: `${lo.created_by} ${statusText} ${lo.customer_name}的装车单`,
      actor: lo.created_by,
      timestamp: dayjs(lo.created_at).format('MM-DD HH:mm'),
    })
  }

  const followups = db.prepare(`
    SELECT f.*
    FROM followups f
    ORDER BY f.followup_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; customer_name: string; followup_by: string; followup_at: string; status: string }>

  for (const f of followups) {
    const statusText = f.status === '已完成' ? '完成了' : '安排了'
    activities.push({
      id: 60000 + f.id,
      type: 'followup',
      action: `${f.followup_by} ${statusText} ${f.customer_name}的回访`,
      actor: f.followup_by,
      timestamp: dayjs(f.followup_at).format('MM-DD HH:mm'),
    })
  }

  activities.sort((a, b) => dayjs(b.timestamp, 'MM-DD HH:mm').valueOf() - dayjs(a.timestamp, 'MM-DD HH:mm').valueOf())

  res.json(activities.slice(0, 15))
})

export default router
