import { Router } from 'express';
import { z } from 'zod';
import supplyService from '../services/supplyService.js';
import { authMiddleware, requireAnyRole } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();
router.use(authMiddleware);

const createSupplySchema = z.object({
  berthingPlanId: z.string().min(1, '靠泊计划ID不能为空'),
  category: z.string().min(1, '类别不能为空'),
  description: z.string().min(1, '描述不能为空'),
  quantity: z.number().positive('数量必须大于0'),
  unit: z.string().min(1, '单位不能为空'),
  estimatedCost: z.number().positive().optional(),
  supplierId: z.string().optional(),
  remarks: z.string().optional(),
});

const updateSupplySchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  estimatedCost: z.number().positive().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DELAYED']),
});

router.get('/', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const filters = {
      berthingPlanId: req.query.berthingPlanId,
      status: req.query.status,
      category: req.query.category,
      supplierId: req.query.supplierId,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await supplyService.getSupplyRequests(filters, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const supplyRequest = await supplyService.getSupplyRequest(req.params.id);
    res.json({
      success: true,
      data: supplyRequest,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = createSupplySchema.parse(req.body);
    const ipAddress = req.ip;
    const supplyRequest = await supplyService.createSupplyRequest(data, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      data: supplyRequest,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = updateSupplySchema.parse(req.body);
    const ipAddress = req.ip;
    const supplyRequest = await supplyService.updateSupplyRequest(req.params.id, data, req.user.id, ipAddress);
    res.json({
      success: true,
      data: supplyRequest,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const ipAddress = req.ip;
    const supplyRequest = await supplyService.updateStatus(req.params.id, status, req.user.id, ipAddress);
    res.json({
      success: true,
      data: supplyRequest,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAnyRole(['AGENT_MANAGER']), async (req, res, next) => {
  try {
    const ipAddress = req.ip;
    const result = await supplyService.deleteSupplyRequest(req.params.id, req.user.id, ipAddress);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
