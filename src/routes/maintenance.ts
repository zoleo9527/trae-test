import { Router, Response } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { idempotencyMiddleware } from '../middleware/idempotency'
import { validateRequest } from '../middleware/validate'
import { createMaintenanceSchema, completeMaintenanceSchema } from '../lib/validation'
import {
  createMaintenance,
  completeMaintenance,
  getMaintenanceList,
  getMaintenanceDetail,
  getMaintenanceCostSummary,
} from '../services/maintenanceService'
import { AuthenticatedRequest } from '../types'

const router = Router()

router.use(authenticate)

router.get('/summary', requirePermission('maintenance:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { startDate, endDate } = req.query
    const result = await getMaintenanceCostSummary(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/', requirePermission('maintenance:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { instrumentId, damageClaimId, status, page, pageSize } = req.query
    const result = await getMaintenanceList(
      instrumentId as string,
      damageClaimId as string,
      status as string,
      Number(page) || 1,
      Number(pageSize) || 20
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requirePermission('maintenance:read'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await getMaintenanceDetail(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

router.post('/',
  requirePermission('maintenance:create'),
  idempotencyMiddleware,
  validateRequest(createMaintenanceSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const maintenance = await createMaintenance({
        ...req.body,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: maintenance, message: '维修单创建成功' })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/:id/complete',
  requirePermission('maintenance:complete'),
  idempotencyMiddleware,
  validateRequest(completeMaintenanceSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const maintenance = await completeMaintenance({
        ...req.body,
        maintenanceId: req.params.id,
        operatorId: req.user!.id,
        operatorName: req.user!.name,
        operatorRole: req.user!.role,
        idempotencyKey: req.idempotencyKey,
      })
      res.json({ success: true, data: maintenance, message: '维修完成' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
