import { Router, Response } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { idempotencyMiddleware } from '../middleware/idempotency'
import { validateRequest } from '../middleware/validate'
import { addNoteSchema } from '../lib/validation'
import { addNote, getEntityNotes, getNotesWithTimeline } from '../services/noteService'
import { getAuditLogs, getEntityAuditTrail } from '../services/auditService'
import { AuthenticatedRequest, EntityType } from '../types'
import { AuditAction } from '@prisma/client'

const router = Router()

router.use(authenticate)

router.get('/audit', requirePermission('audit:read'), async (req: AuthenticatedRequest, res: Response, next) => {
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

router.get('/audit/:entityType/:entityId', requirePermission('audit:read'), async (req: AuthenticatedRequest, res: Response, next) => {
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
      const { isSupplement, supplementReason, ...rest } = req.body

      if (isSupplement && !req.user.role.includes('OWNER')) {
        return res.status(403).json({
          success: false,
          error: '只有门店老板可以补录备注',
          code: 403,
        })
      }

      const note = await addNote({
        ...rest,
        isSupplement,
        supplementReason,
        operatorId: req.user.id,
        operatorName: req.user.name,
        operatorRole: req.user.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: note, message: '备注添加成功' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
