import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../middleware/auth';
import { validateQuery, validateParams } from '../../middleware/validation';
import {
  exportQuerySchema,
  operationLogQuerySchema,
  traceIdSchema,
} from './common.schemas';
import {
  exportData,
  getDashboardStats,
  getOperationLogs,
  traceOperation,
  getErrorLogs,
} from './common.controller';
import { Role, Permission } from '../../types/enums';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: 通用查询与导出
 *   description: 数据导出、仪表板、操作日志、链路追踪
 */

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     tags: [通用查询与导出]
 *     summary: 获取仪表板统计数据
 *     security: [bearerAuth: []]
 */
router.get(
  '/dashboard/stats',
  authenticate,
  getDashboardStats
);

/**
 * @swagger
 * /api/v1/export:
 *   get:
 *     tags: [通用查询与导出]
 *     summary: 导出数据（支持CSV/JSON格式）
 *     security: [bearerAuth: []]
 */
router.get(
  '/export',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.EXPORT_DATA),
  validateQuery(exportQuerySchema),
  exportData
);

/**
 * @swagger
 * /api/v1/operation-logs:
 *   get:
 *     tags: [通用查询与导出]
 *     summary: 获取操作日志列表（支持多条件筛选）
 *     security: [bearerAuth: []]
 */
router.get(
  '/operation-logs',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  validateQuery(operationLogQuerySchema),
  getOperationLogs
);

/**
 * @swagger
 * /api/v1/operation-logs/errors:
 *   get:
 *     tags: [通用查询与导出]
 *     summary: 获取异常操作日志（错误回查）
 *     security: [bearerAuth: []]
 */
router.get(
  '/operation-logs/errors',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  getErrorLogs
);

/**
 * @swagger
 * /api/v1/trace/{traceId}:
 *   get:
 *     tags: [通用查询与导出]
 *     summary: 全链路追踪（按Trace ID查询完整操作链）
 *     security: [bearerAuth: []]
 */
router.get(
  '/trace/:traceId',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  validateParams(traceIdSchema),
  traceOperation
);

export default router;
