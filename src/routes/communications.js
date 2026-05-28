import { Router } from 'express';
import { z } from 'zod';
import communicationService from '../services/communicationService.js';
import { authMiddleware, requireAnyRole } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();
router.use(authMiddleware);

const createCommSchema = z.object({
  berthingPlanId: z.string().min(1, '靠泊计划ID不能为空'),
  type: z.enum(['EMAIL', 'PHONE', 'FAX', 'MEETING', 'OTHER']),
  direction: z.enum(['INBOUND', 'OUTBOUND', 'INTERNAL']),
  subject: z.string().min(1, '主题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  senderName: z.string().min(1, '发送方不能为空'),
  senderContact: z.string().optional(),
  recipientName: z.string().min(1, '接收方不能为空'),
  recipientContact: z.string().optional(),
  supplierId: z.string().optional(),
  isInternal: z.boolean().optional(),
});

router.get('/', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR', 'DOCUMENT_SPECIALIST']), async (req, res, next) => {
  try {
    const filters = {
      berthingPlanId: req.query.berthingPlanId,
      type: req.query.type,
      direction: req.query.direction,
      supplierId: req.query.supplierId,
      isInternal: req.query.isInternal ? req.query.isInternal === 'true' : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await communicationService.getCommunications(filters, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/supplier/:supplierId', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const result = await communicationService.getSupplierCommunications(req.params.supplierId, filters);
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
    const communication = await communicationService.getCommunication(req.params.id);
    res.json({
      success: true,
      data: communication,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR', 'DOCUMENT_SPECIALIST']), async (req, res, next) => {
  try {
    const data = createCommSchema.parse(req.body);
    const ipAddress = req.ip;
    const communication = await communicationService.createCommunication(data, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      data: communication,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAnyRole(['AGENT_MANAGER']), async (req, res, next) => {
  try {
    const ipAddress = req.ip;
    const result = await communicationService.deleteCommunication(req.params.id, req.user.id, ipAddress);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
