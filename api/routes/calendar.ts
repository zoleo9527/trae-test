import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { month, type } = req.query

  if (!month) {
    res.json([])
    return
  }

  const types = type ? (type as string).split(',') : null
  const events: Array<{
    id: number
    type: 'lifting' | 'maintenance' | 'disease' | 'loading' | 'followup'
    title: string
    date: string
    link: string
  }> = []

  const monthStr = month as string
  const [year, monthNum] = monthStr.split('-').map(Number)
  const startDate = dayjs(`${year}-${monthNum}-01`).format('YYYY-MM-DD')
  const endDate = dayjs(`${year}-${monthNum}-01`).endOf('month').format('YYYY-MM-DD')

  if (!types || types.includes('lifting')) {
    const liftingTasks = db.prepare(`
      SELECT t.*, p.name as plot_name
      FROM tasks t
      LEFT JOIN plots p ON t.plot_id = p.id
      WHERE t.type = 'lifting' AND t.due_date IS NOT NULL
        AND date(t.due_date) >= ? AND date(t.due_date) <= ?
    `).all(startDate, endDate) as Array<{ id: number; title: string; due_date: string; plot_name: string; transfer_id: number | null }>

    for (const t of liftingTasks) {
      events.push({
        id: 100 + t.id,
        type: 'lifting',
        title: `${t.plot_name} - ${t.title}`,
        date: t.due_date,
        link: t.transfer_id ? `/transfers/${t.transfer_id}` : '/operations',
      })
    }
  }

  if (!types || types.includes('maintenance')) {
    const maintenanceTasks = db.prepare(`
      SELECT t.*, p.name as plot_name
      FROM tasks t
      LEFT JOIN plots p ON t.plot_id = p.id
      WHERE t.type = 'maintenance' AND t.due_date IS NOT NULL
        AND date(t.due_date) >= ? AND date(t.due_date) <= ?
    `).all(startDate, endDate) as Array<{ id: number; title: string; due_date: string; plot_name: string }>

    for (const t of maintenanceTasks) {
      events.push({
        id: 200 + t.id,
        type: 'maintenance',
        title: `${t.plot_name} - ${t.title}`,
        date: t.due_date,
        link: '/operations',
      })
    }
  }

  if (!types || types.includes('disease')) {
    const diseaseTasks = db.prepare(`
      SELECT t.*, p.name as plot_name, dr.severity
      FROM tasks t
      LEFT JOIN plots p ON t.plot_id = p.id
      LEFT JOIN disease_reports dr ON t.id = dr.task_id
      WHERE t.type = 'disease' AND t.due_date IS NOT NULL
        AND date(t.due_date) >= ? AND date(t.due_date) <= ?
    `).all(startDate, endDate) as Array<{ id: number; title: string; due_date: string; plot_name: string; severity: string }>

    for (const t of diseaseTasks) {
      events.push({
        id: 300 + t.id,
        type: 'disease',
        title: `${t.plot_name} - ${t.title}${t.severity ? `(${t.severity})` : ''}`,
        date: t.due_date,
        link: '/operations',
      })
    }
  }

  if (!types || types.includes('loading')) {
    const loadingOrders = db.prepare(`
      SELECT lo.*, t.customer_name, t.species
      FROM loading_orders lo
      LEFT JOIN transfers t ON lo.transfer_id = t.id
      WHERE lo.created_at IS NOT NULL
        AND date(lo.created_at) >= ? AND date(lo.created_at) <= ?
    `).all(startDate, endDate) as Array<{ id: number; customer_name: string; species: string; created_at: string; status: string }>

    for (const lo of loadingOrders) {
      const statusText = lo.status === '已完成' ? '已完成' : lo.status === '装车中' ? '装车中' : '待装车'
      events.push({
        id: 400 + lo.id,
        type: 'loading',
        title: `${lo.customer_name} - ${lo.species}装车(${statusText})`,
        date: lo.created_at,
        link: `/loading/${lo.id}`,
      })
    }
  }

  if (!types || types.includes('followup')) {
    const followups = db.prepare(`
      SELECT f.*, t.customer_name
      FROM followups f
      LEFT JOIN transfers t ON f.transfer_id = t.id
      WHERE f.followup_at IS NOT NULL
        AND date(f.followup_at) >= ? AND date(f.followup_at) <= ?
    `).all(startDate, endDate) as Array<{ id: number; customer_name: string; followup_at: string; status: string; issue_description: string }>

    for (const f of followups) {
      const statusText = f.status === '已完成' ? '已回访' : '待回访'
      events.push({
        id: 500 + f.id,
        type: 'followup',
        title: `${f.customer_name} - ${statusText}${f.issue_description ? `: ${f.issue_description.substring(0, 15)}` : ''}`,
        date: f.followup_at,
        link: '/followup',
      })
    }
  }

  res.json(events)
})

export default router
