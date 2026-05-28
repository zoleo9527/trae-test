import { Router } from 'express';
import { z } from 'zod';
import taskService from '../services/taskService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const createTaskSchema = z.object({
  type: z.enum(['BERTHING_PLAN', 'DOCUMENT_PREPARE', 'DOCUMENT_SUBMIT', 'CREW_CHANGE', 'SUPPLY_ARRANGE', 'FEE_SETTLE']),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  berthingPlanId: z.string().optional(),
  documentId: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  deadline: z.string().optional(),
  assignedToId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(5).optional(),
  deadline: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
  blockedReason: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      assignedToId: req.query.assignedToId,
      berthingPlanId: req.query.berthingPlanId,
      isBlocking: req.query.isBlocking ? req.query.isBlocking === 'true' : undefined,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || 'priority',
      sortOrder: req.query.sortOrder || 'asc',
    };
    const result = await taskService.getTasks(filters, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
    };
    const result = await taskService.getMyTasks(req.user.id, filters);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/mine', async (req, res, next) => {
  try {
    const stats = await taskService.getTaskStats(req.user.id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/chain/:chainId/progress', async (req, res, next) => {
  try {
    const progress = await taskService.getChainProgress(req.params.chainId);
    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.params.id);
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const ipAddress = req.ip;
    const task = await taskService.createTask(data, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const ipAddress = req.ip;
    const task = await taskService.updateTask(req.params.id, data, req.user.id, ipAddress);
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', async (req, res, next) => {
  try {
    const { status, blockedReason } = statusSchema.parse(req.body);
    const ipAddress = req.ip;
    const task = await taskService.updateTaskStatus(req.params.id, status, req.user.id, ipAddress, blockedReason);
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
