import { Router, Response } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { idempotencyMiddleware, saveIdempotentResponse } from '../middleware/idempotency'
import { validateRequest } from '../middleware/validate'
import { settleDepositSchema } from '../lib/validation'
import { settleDeposit, markDepositDisputed, getDepositList, getDepositDetail } from '../services/depositService'
import { AuthenticatedRequest } from '../types'
import { DepositStatus } from '../types/enums'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('deposit:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status, rentalId, page, pageSize } = req.query
    const result = await getDepositList(
      status as DepositStatus,
      rentalId as string,
      Number(page) || 1,
      Number(pageSize) || 20
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requirePermission('deposit:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await getDepositDetail(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/settle',
  requirePermission('deposit:settle'),
  idempotencyMiddleware,
  validateRequest(settleDepositSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const deposit = await settleDeposit({
        ...req.body,
        depositId: req.params.id,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      const response = { success: true, data: deposit, message: '押金结算完成' }
      if (req.idempotencyKey) {
        await saveIdempotentResponse(req.idempotencyKey, response)
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

router.post('/:id/dispute',
  requirePermission('deposit:dispute'),
  idempotencyMiddleware,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const deposit = await markDepositDisputed(
        req.params.id,
        req.user!.id,
        req.user!.name,
        req.user!.role,
        req.idempotencyKey
      )
      const response = { success: true, data: deposit, message: '押金标记为有争议' }
      if (req.idempotencyKey) {
        await saveIdempotentResponse(req.idempotencyKey, response)
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

export default router
