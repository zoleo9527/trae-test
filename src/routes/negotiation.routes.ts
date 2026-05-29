import { Router, Response } from 'express';
import negotiationService from '../services/negotiation.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { requireIdempotency, checkIdempotency } from '../middleware/idempotency.middleware';
import { validate } from '../middleware/validation.middleware';
import { createNegotiationSchema, updateNegotiationStatusSchema, paginationSchema } from '../validations';
import { AuthenticatedRequest, ApiResponse, Role, NegotiationStatus, ROLE, NEGOTIATION_STATUS } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole([ROLE.SALES_COORDINATOR, ROLE.BASE_MANAGER]),
  requireIdempotency,
  checkIdempotency,
  validate(createNegotiationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await negotiationService.createNegotiation({
        ...req.body,
        idempotencyKey: req.idempotencyKey || uuidv4(),
        creatorId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '补苗协商创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }
);

router.post(
  '/:id/submit',
  requireRole([ROLE.SALES_COORDINATOR, ROLE.BASE_MANAGER]),
  requireIdempotency,
  checkIdempotency,
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const result = await negotiationService.submitNegotiation(id, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: '已提交审核',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '提交失败',
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

      const { status, customerName } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await negotiationService.getNegotiationList({
        status: status as NegotiationStatus,
        customerName: customerName as string,
        handlerId: req.user.role === ROLE.MAINTENANCE_WORKER ? req.user.userId : undefined,
        creatorId: req.user.role === ROLE.SALES_COORDINATOR ? req.user.userId : undefined,
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

router.get(
  '/:id',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const result = await negotiationService.getNegotiationDetail(
        id,
        req.user.userId,
        req.user.role
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: '协商记录不存在',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error instanceof Error && error.message.includes('权限不足') ? 403 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

router.patch(
  '/:id/status',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  requireIdempotency,
  checkIdempotency,
  validate(updateNegotiationStatusSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const result = await negotiationService.updateStatus({
        negotiationId: id,
        userId: req.user.userId,
        ...req.body,
      });

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

router.get(
  '/rejected/list',
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await negotiationService.getRejectedNegotiations(
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

router.get(
  '/followup/list',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await negotiationService.getNeedFollowUp(
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data: result,
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
