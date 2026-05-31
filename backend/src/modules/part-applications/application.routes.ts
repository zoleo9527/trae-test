import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import {
  createApplicationSchema,
  updateApplicationSchema,
  submitApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  supplementApplicationSchema,
  pickupApplicationSchema,
  applicationIdSchema,
  applicationQuerySchema,
  addNoteSchema,
} from './application.schemas';
import {
  createApplication,
  submitApplication,
  getApplication,
  getApplicationList,
  updateApplication,
  approveApplication,
  rejectApplication,
  supplementApplication,
  pickupApplication,
  addNote,
  getStatusTransitions,
  getMyPendingApprovals,
} from './application.controller';
import { Role, Permission } from '../../types/enums';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: 配件申请管理
 *   description: 配件申请的创建、提交、审批、驳回、补录、发放等核心流程
 */

/**
 * @swagger
 * /api/v1/part-applications/status-transitions:
 *   get:
 *     tags: [配件申请管理]
 *     summary: 获取申请单状态流转规则
 *     security: [bearerAuth: []]
 */
router.get(
  '/status-transitions',
  authenticate,
  getStatusTransitions
);

/**
 * @swagger
 * /api/v1/part-applications/pending-approvals:
 *   get:
 *     tags: [配件申请管理]
 *     summary: 获取我需要审批的申请单
 *     security: [bearerAuth: []]
 */
router.get(
  '/pending-approvals',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.PART_APPLICATION_APPROVE),
  getMyPendingApprovals
);

/**
 * @swagger
 * /api/v1/part-applications:
 *   get:
 *     tags: [配件申请管理]
 *     summary: 获取申请单列表（支持分页、多条件筛选）
 *     security: [bearerAuth: []]
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.PART_APPLICATION_VIEW),
  validateQuery(applicationQuerySchema),
  getApplicationList
);

/**
 * @swagger
 * /api/v1/part-applications/{id}:
 *   get:
 *     tags: [配件申请管理]
 *     summary: 获取申请单详情（含完整证据链、状态历史、备注）
 *     security: [bearerAuth: []]
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.PART_APPLICATION_VIEW),
  validateParams(applicationIdSchema),
  getApplication
);

/**
 * @swagger
 * /api/v1/part-applications:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 创建配件申请单（草稿状态）
 *     security: [bearerAuth: []]
 */
router.post(
  '/',
  authenticate,
  requireRole(Role.RECEPTIONIST, Role.TECHNICIAN, Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.PART_APPLICATION_CREATE),
  validateBody(createApplicationSchema),
  createApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}:
 *   put:
 *     tags: [配件申请管理]
 *     summary: 更新申请单（仅草稿状态）
 *     security: [bearerAuth: []]
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Permission.PART_APPLICATION_CREATE),
  validateParams(applicationIdSchema),
  validateBody(updateApplicationSchema),
  updateApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}/submit:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 提交审批（草稿 -> 待审批）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/submit',
  authenticate,
  requirePermission(Permission.PART_APPLICATION_CREATE),
  validateParams(applicationIdSchema),
  validateBody(submitApplicationSchema),
  submitApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}/approve:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 审批通过（自动锁定可用库存）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/approve',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.PART_APPLICATION_APPROVE),
  validateParams(applicationIdSchema),
  validateBody(approveApplicationSchema),
  approveApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}/reject:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 驳回申请（必须填写驳回原因）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/reject',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.PART_APPLICATION_REJECT),
  validateParams(applicationIdSchema),
  validateBody(rejectApplicationSchema),
  rejectApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}/supplement:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 补录说明并重新提交（驳回 -> 待审批）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/supplement',
  authenticate,
  requirePermission(Permission.PART_APPLICATION_CREATE),
  validateParams(applicationIdSchema),
  validateBody(supplementApplicationSchema),
  supplementApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}/pickup:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 配件发放/取件（自动消耗锁定库存）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/pickup',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.TECHNICIAN, Role.ADMIN),
  requirePermission(Permission.INVENTORY_EDIT),
  validateParams(applicationIdSchema),
  validateBody(pickupApplicationSchema),
  pickupApplication
);

/**
 * @swagger
 * /api/v1/part-applications/{id}/notes:
 *   post:
 *     tags: [配件申请管理]
 *     summary: 添加备注（驳回原因、补录说明、跟进记录等）
 *     security: [bearerAuth: []]
 */
router.post(
  '/:id/notes',
  authenticate,
  requirePermission(Permission.PART_APPLICATION_VIEW),
  validateParams(applicationIdSchema),
  validateBody(addNoteSchema),
  addNote
);

export default router;
