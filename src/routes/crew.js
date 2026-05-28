import { Router } from 'express';
import { z } from 'zod';
import crewService from '../services/crewService.js';
import { authMiddleware, requireAnyRole } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();
router.use(authMiddleware);

const createCrewSchema = z.object({
  berthingPlanId: z.string().min(1, '靠泊计划ID不能为空'),
  type: z.enum(['EMBARKATION', 'DISEMBARKATION', 'TRANSFER']),
  crewName: z.string().min(1, '船员姓名不能为空'),
  position: z.string().min(1, '职位不能为空'),
  nationality: z.string().min(1, '国籍不能为空'),
  passportNo: z.string().min(1, '护照号不能为空'),
  visaNo: z.string().optional(),
  remarks: z.string().optional(),
});

const updateCrewSchema = z.object({
  type: z.enum(['EMBARKATION', 'DISEMBARKATION', 'TRANSFER']).optional(),
  crewName: z.string().optional(),
  position: z.string().optional(),
  nationality: z.string().optional(),
  passportNo: z.string().optional(),
  visaNo: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
});

router.get('/', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR', 'DOCUMENT_SPECIALIST']), async (req, res, next) => {
  try {
    const filters = {
      berthingPlanId: req.query.berthingPlanId,
      status: req.query.status,
      type: req.query.type,
      nationality: req.query.nationality,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    const result = await crewService.getCrewChanges(filters, options);
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
    const crewChange = await crewService.getCrewChange(req.params.id);
    res.json({
      success: true,
      data: crewChange,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = createCrewSchema.parse(req.body);
    const ipAddress = req.ip;
    const crewChange = await crewService.createCrewChange(data, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      data: crewChange,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAnyRole(['AGENT_MANAGER', 'FIELD_COORDINATOR']), async (req, res, next) => {
  try {
    const data = updateCrewSchema.parse(req.body);
    const ipAddress = req.ip;
    const crewChange = await crewService.updateCrewChange(req.params.id, data, req.user.id, ipAddress);
    res.json({
      success: true,
      data: crewChange,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', idempotencyMiddleware, requireAnyRole(['AGENT_MANAGER']), async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const ipAddress = req.ip;
    const crewChange = await crewService.updateStatus(req.params.id, status, req.user.id, ipAddress);
    res.json({
      success: true,
      data: crewChange,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAnyRole(['AGENT_MANAGER']), async (req, res, next) => {
  try {
    const ipAddress = req.ip;
    const result = await crewService.deleteCrewChange(req.params.id, req.user.id, ipAddress);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
