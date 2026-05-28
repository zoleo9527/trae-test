import { Router, Response } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { idempotencyMiddleware } from '../middleware/idempotency'
import { validateRequest } from '../middleware/validate'
import {
  createDamageClaimSchema,
  disputeDamageClaimSchema,
  rejectDisputeSchema,
  resolveDisputeSchema,
} from '../lib/validation'
import {
  createDamageClaim,
  disputeDamageClaim,
  rejectDispute,
  resolveDispute,
  confirmDamageClaim,
  closeDamageClaim,
  getDamageClaimList,
  getDamageClaimDetail,
  getEvidenceChain,
} from '../services/damageClaimService'
import { AuthenticatedRequest } from '../types'
import { DamageClaimStatus } from '@prisma/client'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('damage:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status, rentalId, instrumentId, page, pageSize } = req.query
    const result = await getDamageClaimList(
      status as DamageClaimStatus,
      rentalId as string,
      instrumentId as string,
      Number(page) || 1,
      Number(pageSize) || 20
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requirePermission('damage:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await getDamageClaimDetail(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/evidence', requirePermission('damage:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await getEvidenceChain(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.post('/',
  requirePermission('damage:create'),
  idempotencyMiddleware,
  validateRequest(createDamageClaimSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const claim = await createDamageClaim({
        ...req.body,
        operatorId: req.user.id,
        operatorName: req.user.name,
        operatorRole: req.user.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: claim, message: '损坏申诉创建成功' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/:id/confirm',
  requirePermission('damage:report'),
  idempotencyMiddleware,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const claim = await confirmDamageClaim(
        req.params.id,
        req.user.id,
        req.user.name,
        req.user.role,
        req.idempotencyKey
      )
      res.json({ success: true, data: claim, message: '损坏判定已确认' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/dispute',
  requirePermission('damage:report'),
  idempotencyMiddleware,
  validateRequest(disputeDamageClaimSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const claim = await disputeDamageClaim({
        ...req.body,
        operatorId: req.user.id,
        operatorName: req.user.name,
        operatorRole: req.user.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: claim, message: '客户申诉已提交' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/reject',
  requirePermission('damage:resolve'),
  idempotencyMiddleware,
  validateRequest(rejectDisputeSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const claim = await rejectDispute({
        ...req.body,
        operatorId: req.user.id,
        operatorName: req.user.name,
        operatorRole: req.user.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: claim, message: '申诉已驳回' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/resolve',
  requirePermission('damage:resolve'),
  idempotencyMiddleware,
  validateRequest(resolveDisputeSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const claim = await resolveDispute({
        ...req.body,
        operatorId: req.user.id,
        operatorName: req.user.name,
        operatorRole: req.user.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: claim, message: '申诉已通过，重新判定完成' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/:id/close',
  requirePermission('damage:close'),
  idempotencyMiddleware,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const claim = await closeDamageClaim(
        req.params.id,
        req.user.id,
        req.user.name,
        req.user.role,
        req.idempotencyKey
      )
      res.json({ success: true, data: claim, message: '损坏申诉已结案' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
