import { Router } from 'express';
import { z } from 'zod';
import feeService from '../services/feeService.js';
import { authMiddleware, requireAnyRole } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();
router.use(authMiddleware);

const createFeeSchema = z.object({
  berthingPlanId: z.string().min(1, '靠泊计划ID不能为空'),
  category: z.string().min(1, '费用类别不能为空'),
  description: z.string().optional(),
  amount: z.number().positive('金额必须大于0'),
  currency: z.string().default('CNY'),
  supplierId: z.string().optional(),
  invoiceNo: z.string().optional(),
  dueDate: z.string().optional(),
  remarks: z.string().optional(),
});

const updateFeeSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  invoiceNo: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const paySchema = z.object({
  paymentRef: z.string().min(1, '支付凭证不能为空'),
});

router.get('/', requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const filters = {
      berthingPlanId: req.query.berthingPlanId,
      isPaid: req.query.isPaid ? req.query.isPaid === 'true' : undefined,
      category: req.query.category,
      supplierId: req.query.supplierId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await feeService.getFees(filters, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/overdue', requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER']), async (req, res, next) => {
  try {
    const fees = await feeService.getOverdueFees();
    res.json({
      success: true,
      data: fees,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER']), async (req, res, next) => {
  try {
    const stats = await feeService.getFeeStats(req.query.berthingPlanId);
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
    const fee = await feeService.getFee(req.params.id);
    res.json({
      success: true,
      data: fee,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = createFeeSchema.parse(req.body);
    const ipAddress = req.ip;
    const fee = await feeService.createFee(data, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      data: fee,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER']), async (req, res, next) => {
  try {
    const data = updateFeeSchema.parse(req.body);
    const ipAddress = req.ip;
    const fee = await feeService.updateFee(req.params.id, data, req.user.id, ipAddress);
    res.json({
      success: true,
      data: fee,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pay', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER']), async (req, res, next) => {
  try {
    const { paymentRef } = paySchema.parse(req.body);
    const ipAddress = req.ip;
    const fee = await feeService.markAsPaid(req.params.id, paymentRef, req.user.id, ipAddress);
    res.json({
      success: true,
      data: fee,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAnyRole(['AGENT_MANAGER', 'FINANCE_OFFICER']), async (req, res, next) => {
  try {
    const ipAddress = req.ip;
    const result = await feeService.deleteFee(req.params.id, req.user.id, ipAddress);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
