import { Router, Response } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { idempotencyMiddleware, saveIdempotentResponse } from '../middleware/idempotency'
import { validateRequest } from '../middleware/validate'
import { createRentalSchema, returnRentalSchema } from '../lib/validation'
import { createRental, returnRental, getRentalList, getRentalDetail, getInstrumentList } from '../services/rentalService'
import { AuthenticatedRequest } from '../types'
import { RentalStatus, InstrumentStatus } from '../types/enums'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('rental:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status, customerId, instrumentId, page, pageSize } = req.query
    const result = await getRentalList(
      status as RentalStatus,
      customerId as string,
      instrumentId as string,
      Number(page) || 1,
      Number(pageSize) || 20
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requirePermission('rental:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await getRentalDetail(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.post('/',
  requirePermission('rental:create'),
  idempotencyMiddleware,
  validateRequest(createRentalSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const rental = await createRental({
        ...req.body,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      const response = { success: true, data: rental, message: '租赁创建成功' }
      if (req.idempotencyKey) {
        await saveIdempotentResponse(req.idempotencyKey, response)
      }
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
)

router.post('/:id/return',
  requirePermission('rental:return'),
  idempotencyMiddleware,
  validateRequest(returnRentalSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const rental = await returnRental({
        ...req.body,
        rentalId: req.params.id,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      const response = { success: true, data: rental, message: '归还成功' }
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
