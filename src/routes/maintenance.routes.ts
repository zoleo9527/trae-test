import { Router, Response } from 'express';
import maintenanceService from '../services/maintenance.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { requireIdempotency, checkIdempotency } from '../middleware/idempotency.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createMaintenanceSchema,
  reviewMaintenanceSchema,
  createDiseaseReportSchema,
  resolveDiseaseSchema,
  paginationSchema,
} from '../validations';
import { AuthenticatedRequest, ApiResponse, Role, MaintenanceType, DiseaseSeverity, ROLE, MAINTENANCE_TYPE, DISEASE_SEVERITY } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole([ROLE.MAINTENANCE_WORKER, ROLE.BASE_MANAGER]),
  requireIdempotency,
  checkIdempotency,
  validate(createMaintenanceSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await maintenanceService.createMaintenance({
        ...req.body,
        idempotencyKey: req.idempotencyKey || uuidv4(),
        workerId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '养护记录创建成功',
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
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { plotId, type, needsReview } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await maintenanceService.getMaintenanceList({
        plotId: plotId as string,
        workerId: req.user.role === ROLE.MAINTENANCE_WORKER ? req.user.userId : undefined,
        type: type as MaintenanceType,
        needsReview: needsReview === 'true',
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
  '/:id/review',
  requireRole([ROLE.BASE_MANAGER]),
  validate(reviewMaintenanceSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const { reviewNote, needsFollowUp } = req.body;

      const result = await maintenanceService.reviewMaintenance(
        id,
        req.user.userId,
        reviewNote,
        needsFollowUp
      );

      res.json({
        success: true,
        data: result,
        message: '审核完成',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '审核失败',
      });
    }
  }
);

router.post(
  '/disease',
  requireRole([ROLE.MAINTENANCE_WORKER, ROLE.BASE_MANAGER]),
  requireIdempotency,
  checkIdempotency,
  validate(createDiseaseReportSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await maintenanceService.createDiseaseReport({
        ...req.body,
        idempotencyKey: req.idempotencyKey || uuidv4(),
        reporterId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '病害上报成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '上报失败',
      });
    }
  }
);

router.get(
  '/disease',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { plotId, severity, isResolved } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await maintenanceService.getDiseaseReportList({
        plotId: plotId as string,
        reporterId: req.user.role === ROLE.MAINTENANCE_WORKER ? req.user.userId : undefined,
        severity: severity as DiseaseSeverity,
        isResolved: isResolved === 'true',
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
  '/disease/:id/resolve',
  requireRole([ROLE.BASE_MANAGER]),
  validate(resolveDiseaseSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const { resolutionNote } = req.body;

      const result = await maintenanceService.resolveDiseaseReport(
        id,
        req.user.userId,
        resolutionNote
      );

      res.json({
        success: true,
        data: result,
        message: '病害已处理',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '处理失败',
      });
    }
  }
);

export default router;
