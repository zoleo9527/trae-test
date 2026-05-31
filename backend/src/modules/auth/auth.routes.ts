import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validation';
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userIdSchema,
} from './auth.schemas';
import {
  login,
  getCurrentUser,
  changePassword,
  createUser,
  updateUser,
  getUserList,
} from './auth.controller';
import { Role, Permission } from '../../types/enums';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [认证]
 *     summary: 用户登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [认证]
 *     summary: 获取当前用户信息
 *     security: [bearerAuth: []]
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [认证]
 *     summary: 修改密码
 *     security: [bearerAuth: []]
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  changePassword
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [用户管理]
 *     summary: 获取用户列表
 *     security: [bearerAuth: []]
 */
router.get(
  '/users',
  authenticate,
  requireRole(Role.ADMIN, Role.SERVICE_MANAGER),
  getUserList
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags: [用户管理]
 *     summary: 创建用户
 *     security: [bearerAuth: []]
 */
router.post(
  '/users',
  authenticate,
  requireRole(Role.ADMIN),
  requirePermission(Permission.SYSTEM_CONFIG),
  validateBody(createUserSchema),
  createUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags: [用户管理]
 *     summary: 更新用户
 *     security: [bearerAuth: []]
 */
router.put(
  '/users/:id',
  authenticate,
  requireRole(Role.ADMIN),
  requirePermission(Permission.SYSTEM_CONFIG),
  validateParams(userIdSchema),
  validateBody(updateUserSchema),
  updateUser
);

export default router;
