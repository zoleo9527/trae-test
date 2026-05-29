import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/daily', (req: Request, res: Response): void => {
  try {
    const { date } = req.query
    if (!date) {
      res.status(400).json({ success: false, error: '缺少date参数' })
      return
    }

    const db = getDb()
    const dateStr = date as string
    const logs = db.prepare(
      "SELECT * FROM action_logs WHERE created_at >= ? AND created_at < ? ORDER BY created_at ASC"
    ).all(`${dateStr} 00:00:00`, `${dateStr} 23:59:59`)

    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/calendar', (req: Request, res: Response): void => {
  try {
    const { month } = req.query
    if (!month) {
      res.status(400).json({ success: false, error: '缺少month参数' })
      return
    }

    const db = getDb()
    const monthStr = month as string
    const startDate = `${monthStr}-01`
    const [year, mon] = monthStr.split('-').map(Number)
    const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`

    const dailyLogs = db.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM action_logs
       WHERE created_at >= ? AND created_at < ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ).all(`${startDate} 00:00:00`, `${nextMonth}-01 00:00:00`)

    const reworkDates = db.prepare(
      `SELECT DISTINCT DATE(ro.created_at) as date FROM rework_orders ro
       WHERE ro.created_at >= ? AND ro.created_at < ?`
    ).all(`${startDate} 00:00:00`, `${nextMonth}-01 00:00:00`)

    const reworkDateSet = new Set(reworkDates.map((r: any) => r.date))

    const result = dailyLogs.map((row: any) => ({
      date: row.date,
      count: row.count,
      has_rework: reworkDateSet.has(row.date),
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
