import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import {
  createPartSchema,
  updatePartSchema,
  createInventorySchema,
  updateInventorySchema,
  lockInventorySchema,
  unlockInventorySchema,
  partIdSchema,
  inventoryIdSchema,
  lockIdSchema,
  partQuerySchema,
  inventoryQuerySchema,
  lockQuerySchema,
} from './inventory.schemas';
import {
  createPart,
  getPart,
  getPartList,
  updatePart,
  createInventory,
  getInventory,
  getInventoryList,
  updateInventory,
  lockInventory,
  releaseLock,
  consumeLock,
  getLockList,
  cleanupExpiredLocks,
} from './inventory.controller';
import { Role, Permission } from '../../types/enums';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: 配件与库存管理
 *   description: 配件目录、库存、锁定管理
 */

// === 配件管理 ===

/**
 * @swagger
 * /api/v1/inventory/parts:
 *   get:
 *     tags: [配件与库存管理]
 *     summary: 获取配件列表
 *     security: [bearerAuth: []]
 */
router.get(
  '/parts',
  authenticate,
  requirePermission(Permission.INVENTORY_VIEW),
  validateQuery(partQuerySchema),
  getPartList
);

/**
 * @swagger
 * /api/v1/inventory/parts/{id}:
 *   get:
 *     tags: [配件与库存管理]
 *     summary: 获取配件详情
 *     security: [bearerAuth: []]
 */
router.get(
  '/parts/:id',
  authenticate,
  requirePermission(Permission.INVENTORY_VIEW),
  validateParams(partIdSchema),
  getPart
);

/**
 * @swagger
 * /api/v1/inventory/parts:
 *   post:
 *     tags: [配件与库存管理]
 *     summary: 创建配件
 *     security: [bearerAuth: []]
 */
router.post(
  '/parts',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  requirePermission(Permission.INVENTORY_EDIT),
  validateBody(createPartSchema),
  createPart
);

/**
 * @swagger
 * /api/v1/inventory/parts/{id}:
 *   put:
 *     tags: [配件与库存管理]
 *     summary: 更新配件
 *     security: [bearerAuth: []]
 */
router.put(
  '/parts/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  requirePermission(Permission.INVENTORY_EDIT),
  validateParams(partIdSchema),
  validateBody(updatePartSchema),
  updatePart
);

// === 库存管理 ===

/**
 * @swagger
 * /api/v1/inventory/inventories:
 *   get:
 *     tags: [配件与库存管理]
 *     summary: 获取库存列表（支持低库存筛选）
 *     security: [bearerAuth: []]
 */
router.get(
  '/inventories',
  authenticate,
  requirePermission(Permission.INVENTORY_VIEW),
  validateQuery(inventoryQuerySchema),
  getInventoryList
);

/**
 * @swagger
 * /api/v1/inventory/inventories/{id}:
 *   get:
 *     tags: [配件与库存管理]
 *     summary: 获取库存详情（含锁定信息）
 *     security: [bearerAuth: []]
 */
router.get(
  '/inventories/:id',
  authenticate,
  requirePermission(Permission.INVENTORY_VIEW),
  validateParams(inventoryIdSchema),
  getInventory
);

/**
 * @swagger
 * /api/v1/inventory/inventories:
 *   post:
 *     tags: [配件与库存管理]
 *     summary: 创建库存记录
 *     security: [bearerAuth: []]
 */
router.post(
  '/inventories',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  requirePermission(Permission.INVENTORY_EDIT),
  validateBody(createInventorySchema),
  createInventory
);

/**
 * @swagger
 * /api/v1/inventory/inventories/{id}:
 *   put:
 *     tags: [配件与库存管理]
 *     summary: 更新库存
 *     security: [bearerAuth: []]
 */
router.put(
  '/inventories/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  requirePermission(Permission.INVENTORY_EDIT),
  validateParams(inventoryIdSchema),
  validateBody(updateInventorySchema),
  updateInventory
);

// === 库存锁定管理 ===

/**
 * @swagger
 * /api/v1/inventory/locks:
 *   get:
 *     tags: [配件与库存管理]
 *     summary: 获取锁定记录列表
 *     security: [bearerAuth: []]
 */
router.get(
  '/locks',
  authenticate,
  requirePermission(Permission.INVENTORY_VIEW),
  validateQuery(lockQuerySchema),
  getLockList
);

/**
 * @swagger
 * /api/v1/inventory/locks:
 *   post:
 *     tags: [配件与库存管理]
 *     summary: 锁定库存
 *     security: [bearerAuth: []]
 */
router.post(
  '/locks',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.TECHNICIAN, Role.ADMIN),
  requirePermission(Permission.INVENTORY_LOCK),
  validateBody(lockInventorySchema),
  lockInventory
);

/**
 * @swagger
 * /api/v1/inventory/locks/{id}/release:
 *   post:
 *     tags: [配件与库存管理]
 *     summary: 释放库存锁定
 *     security: [bearerAuth: []]
 */
router.post(
  '/locks/:id/release',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.ADMIN),
  requirePermission(Permission.INVENTORY_UNLOCK),
  validateParams(lockIdSchema),
  validateBody(unlockInventorySchema),
  releaseLock
);

/**
 * @swagger
 * /api/v1/inventory/locks/{id}/consume:
 *   post:
 *     tags: [配件与库存管理]
 *     summary: 消耗锁定库存（实际出库）
 *     security: [bearerAuth: []]
 */
router.post(
  '/locks/:id/consume',
  authenticate,
  requireRole(Role.SERVICE_MANAGER, Role.TECHNICIAN, Role.ADMIN),
  requirePermission(Permission.INVENTORY_EDIT),
  validateParams(lockIdSchema),
  consumeLock
);

/**
 * @swagger
 * /api/v1/inventory/locks/cleanup-expired:
 *   post:
 *     tags: [配件与库存管理]
 *     summary: 清理过期锁定（定时任务或手动触发）
 *     security: [bearerAuth: []]
 */
router.post(
  '/locks/cleanup-expired',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  cleanupExpiredLocks
);

export default router;
