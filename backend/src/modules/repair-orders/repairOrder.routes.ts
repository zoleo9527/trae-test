import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import {
  createRepairOrderSchema,
  updateRepairOrderSchema,
  changeStatusSchema,
  quotationSchema,
  customerConfirmSchema,
  satisfactionSchema,
  repairOrderIdSchema,
  repairOrderQuerySchema,
  noteSchema,
} from './repairOrder.schemas';
import {
  createRepairOrder,
  getRepairOrder,
  getRepairOrderList,
  updateRepairOrder,
  changeStatus,
  submitQuotation,
  customerConfirmQuotation,
  submitSatisfaction,
  addNote,
  getStatusTransitions,
} from './repairOrder.controller';
import { Role, Permission } from '../../types/enums';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: 寄修单管理
 *   description: 寄修单的创建、查询、状态流转等操作
 */

/**
 * @swagger
 * /api/v1/repair-orders/status-transitions:
 *   get:
 *     tags: [寄修单管理]
 *     summary: 获取状态流转规则
 *     security: [bearerAuth: []]
 */
router.get(
  '/status-transitions',
  authenticate,
  getStatusTransitions
);

/**
 * @swagger
 * /api/v1/repair-orders:
 *   get:
 *     tags: [寄修单管理]
 *     summary: 获取寄修单列表（支持分页、筛选）
 *     security: [bearerAuth: []]
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.REPAIR_ORDER_VIEW),
  validateQuery(repairOrderQuerySchema),
  getRepairOrderList
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}:
 *   get:
 *     tags: [寄修单管理]
 *     summary: 获取寄修单详情（含完整证据链）
 *     security: [bearerAuth: []]
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.REPAIR_ORDER_VIEW),
  validateParams(repairOrderIdSchema),
  getRepairOrder
);

/**
 * @swagger
 * /api/v1/repair-orders:
 *   post:
 *     tags: [寄修单管理]
 *     summary: 创建寄修单
 *     security: [bearerAuth: []]
 */
router.post(
  '/',
  authenticate,
  requireRole(Role.RECEPTIONIST, Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.REPAIR_ORDER_CREATE),
  validateBody(createRepairOrderSchema),
  createRepairOrder
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}:
 *   put:
 *     tags: [寄修单管理]
 *     summary: 更新寄修单基本信息
 *     security: [bearerAuth: []]
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.REPAIR_ORDER_EDIT),
  validateParams(repairOrderIdSchema),
  validateBody(updateRepairOrderSchema),
  updateRepairOrder
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}/status:
 *   patch:
 *     tags: [寄修单管理]
 *     summary: 变更寄修单状态（含流转校验）
 *     security: [bearerAuth: []]
 */
router.patch(
  '/:id/status',
  authenticate,
  requirePermission(Permission.REPAIR_ORDER_EDIT),
  validateParams(repairOrderIdSchema),
  validateBody(changeStatusSchema),
  changeStatus
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}/quotation:
 *   post:
 *     tags: [寄修单管理]
 *     summary: 提交报价
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/quotation',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.REPAIR_ORDER_EDIT),
  validateParams(repairOrderIdSchema),
  validateBody(quotationSchema),
  submitQuotation
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}/confirm-quotation:
 *   post:
 *     tags: [寄修单管理]
 *     summary: 客户确认/拒绝报价
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/confirm-quotation',
  authenticate,
  requireRole(Role.RECEPTIONIST, Role.SERVICE_MANAGER, Role.ADMIN),
  validateParams(repairOrderIdSchema),
  validateBody(customerConfirmSchema),
  customerConfirmQuotation
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}/satisfaction:
 *   post:
 *     tags: [寄修单管理]
 *     summary: 提交满意度评分
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/satisfaction',
  authenticate,
  requireRole(Role.RECEPTIONIST, Role.SERVICE_MANAGER, Role.ADMIN),
  validateParams(repairOrderIdSchema),
  validateBody(satisfactionSchema),
  submitSatisfaction
);

/**
 * @swagger
 * /api/v1/repair-orders/{id}/notes:
 *   post:
 *     tags: [寄修单管理]
 *     summary: 添加备注（驳回原因、补录说明等）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/notes',
  authenticate,
  requirePermission(Permission.REPAIR_ORDER_EDIT),
  validateParams(repairOrderIdSchema),
  validateBody(noteSchema),
  addNote
);

export default router;
