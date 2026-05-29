import { Router, Response } from 'express';
import dashboardService from '../services/dashboard.service';
import todoService from '../services/todo.service';
import maintenanceService from '../services/maintenance.service';
import visitService from '../services/visit.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { requireIdempotency, checkIdempotency } from '../middleware/idempotency.middleware';
import { validate } from '../middleware/validation.middleware';
import { completeTodoSchema, paginationSchema } from '../validations';
import { AuthenticatedRequest, ApiResponse, Role, ROLE, TodoType, TODO_TYPE } from '../types';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const data = await dashboardService.getDashboardData(
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data,
        message: '仪表盘数据获取成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取数据失败',
      });
    }
  }
);

router.get(
  '/todos',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { isCompleted, type } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await todoService.getMyTodos(req.user.userId, {
        isCompleted: isCompleted === 'true',
        type: type ? (type as TodoType) : undefined,
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
  '/todos/stats',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const stats = await todoService.getTodoStats(req.user.userId);

      res.json({
        success: true,
        data: stats,
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
  '/todos/:id/complete',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  requireIdempotency,
  checkIdempotency,
  validate(completeTodoSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const result = await todoService.completeTodo(id, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: '待办已完成',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '操作失败',
      });
    }
  }
);

router.get(
  '/diseases/unresolved',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await maintenanceService.getUnresolvedDiseases(
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
  '/visits/followup',
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await visitService.getNeedFollowUpVisits(
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
  '/audit-logs',
  requireRole([ROLE.BASE_MANAGER]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      const { entityType, entityId, userId, action } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await dashboardService.getAuditLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        userId: userId as string,
        action: action as string,
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
