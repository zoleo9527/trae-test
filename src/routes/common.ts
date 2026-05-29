import { Router, Response } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { idempotencyMiddleware } from '../middleware/idempotency'
import { validateRequest } from '../middleware/validate'
import { addNoteSchema } from '../lib/validation'
import { addNote, addSupplementNote, getEntityNotes, getNotesWithTimeline } from '../services/noteService'
import { getAuditLogs, getEntityAuditTrail } from '../services/auditService'
import { getInstrumentList } from '../services/rentalService'
import { AuthenticatedRequest, EntityType } from '../types'
import { AuditAction, Role } from '../types/enums'
import prisma from '../lib/prisma'

const router = Router()

router.use(authenticate)

router.get('/instruments', requirePermission('rental:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status, category, page, pageSize } = req.query
    const result = await getInstrumentList(
      status as any,
      category as string,
      Number(page) || 1,
      Number(pageSize) || 20
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/customers', requirePermission('rental:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { name, phone, page, pageSize } = req.query
    const where: Record<string, unknown> = {}
    if (name) where.name = { contains: name as string }
    if (phone) where.phone = { contains: phone as string }

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1 || 0) * (Number(pageSize) || 20),
        take: Number(pageSize) || 20,
        include: {
          _count: { select: { rentals: true } },
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 20,
        totalPages: Math.ceil(total / (Number(pageSize) || 20)),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/audit-logs', requirePermission('audit:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { entityType, entityId, action, operatorId, page, pageSize } = req.query
    const result = await getAuditLogs(
      entityType as EntityType,
      entityId as string,
      action as AuditAction,
      operatorId as string,
      Number(page) || 1,
      Number(pageSize) || 20
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/audit-logs/:entityType/:entityId', requirePermission('audit:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await getEntityAuditTrail(
      req.params.entityType as EntityType,
      req.params.entityId
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/notes/:entityType/:entityId', requirePermission('note:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { withTimeline } = req.query
    if (withTimeline === 'true') {
      const result = await getNotesWithTimeline(
        req.params.entityType as EntityType,
        req.params.entityId
      )
      res.json({ success: true, data: result })
    } else {
      const result = await getEntityNotes(
        req.params.entityType as EntityType,
        req.params.entityId
      )
      res.json({ success: true, data: result })
    }
  } catch (error) {
    next(error)
  }
})

router.post('/notes',
  requirePermission('note:create'),
  idempotencyMiddleware,
  validateRequest(addNoteSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const note = await addNote({
        ...req.body,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: note, message: '备注添加成功' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/notes/supplement',
  requirePermission('note:supplement'),
  idempotencyMiddleware,
  validateRequest(addNoteSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { supplementReason } = req.body
      if (!supplementReason) {
        return res.status(400).json({
          success: false,
          error: '补录备注必须填写补录原因',
          code: 400,
        })
      }

      const note = await addSupplementNote({
        ...req.body,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: note, message: '补录备注成功' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
