import { Router, Response } from 'express';
import harvestService from '../services/harvest.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { requireIdempotency, checkIdempotency } from '../middleware/idempotency.middleware';
import { validate } from '../middleware/validation.middleware';
import { createHarvestSchema, updateHarvestStatusSchema, createLoadingSchema, paginationSchema } from '../validations';
import { AuthenticatedRequest, ApiResponse, Role, HarvestStatus, ROLE, HARVEST_STATUS } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  requireIdempotency,
  checkIdempotency,
  validate(createHarvestSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await harvestService.createHarvest({
        ...req.body,
        idempotencyKey: req.idempotencyKey || uuidv4(),
        creatorId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '起苗记录创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }
);

router.get(
  '/',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { status, plotId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await harvestService.getHarvestList({
        status: status as HarvestStatus,
        plotId: plotId as string,
        creatorId: req.user.role === ROLE.SALES_COORDINATOR ? req.user.userId : undefined,
        assigneeId: req.user.role === ROLE.MAINTENANCE_WORKER ? req.user.userId : undefined,
        page,
        pageSize,
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

router.patch(
  '/:id/status',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER]),
  requireIdempotency,
  checkIdempotency,
  validate(updateHarvestStatusSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const { status, actualQuantity, qualityGrade, rejectionReason } = req.body;

      const result = await harvestService.updateHarvestStatus(
        id,
        req.user.userId,
        status,
        actualQuantity,
        qualityGrade,
        rejectionReason
      );

      res.json({
        success: true,
        data: result,
        message: '状态更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      });
    }
  }
);

router.post(
  '/loading',
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  requireIdempotency,
  checkIdempotency,
  validate(createLoadingSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await harvestService.createLoadingRecord(
        {
          ...req.body,
          idempotencyKey: req.idempotencyKey || uuidv4(),
        },
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: '装车记录创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }
);

router.get(
  '/loading',
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      const { harvestId, customerName } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await harvestService.getLoadingList({
        harvestId: harvestId as string,
        customerName: customerName as string,
        page,
        pageSize,
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

export default router;
