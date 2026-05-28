import { Router } from 'express';
import { z } from 'zod';
import berthingService from '../services/berthingService.js';
import taskService from '../services/taskService.js';
import { authMiddleware, requireAnyRole } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();
router.use(authMiddleware);

const createPlanSchema = z.object({
  vesselId: z.string().min(1, '船舶ID不能为空'),
  portId: z.string().min(1, '港口ID不能为空'),
  terminalId: z.string().optional(),
  eta: z.string().min(1, '预计到港时间不能为空'),
  etd: z.string().optional(),
  purpose: z.string().optional(),
  cargoType: z.string().optional(),
  cargoQuantity: z.number().optional(),
  crewCount: z.number().int().optional(),
  remarks: z.string().optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

const updatePlanSchema = z.object({
  vesselId: z.string().optional(),
  portId: z.string().optional(),
  terminalId: z.string().optional().nullable(),
  eta: z.string().optional(),
  etd: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  cargoType: z.string().optional().nullable(),
  cargoQuantity: z.number().optional().nullable(),
  crewCount: z.number().int().optional().nullable(),
  remarks: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(10).optional(),
});

const statusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED']),
  remarks: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      vesselId: req.query.vesselId,
      portId: req.query.portId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      priority: req.query.priority ? parseInt(req.query.priority) : undefined,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'eta',
      sortOrder: req.query.sortOrder || 'asc',
    };
    const result = await berthingService.getPlans(filters, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/stats', async (req, res, next) => {
  try {
    const stats = await berthingService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const plan = await berthingService.getPlan(req.params.id);
    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chain/:chainId', async (req, res, next) => {
  try {
    const plans = await berthingService.getPlanByChain(req.params.chainId);
    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = createPlanSchema.parse(req.body);
    const ipAddress = req.ip;
    const plan = await berthingService.createPlan(data, req.user.id, ipAddress);
    await taskService.createTaskChain(plan.id, req.user.id);
    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = updatePlanSchema.parse(req.body);
    const ipAddress = req.ip;
    const plan = await berthingService.updatePlan(req.params.id, data, req.user.id, ipAddress);
    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const { status, remarks } = statusSchema.parse(req.body);
    const ipAddress = req.ip;
    const plan = await berthingService.updateStatus(req.params.id, status, req.user.id, ipAddress, remarks);
    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
