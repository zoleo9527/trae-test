import { Router, Response } from 'express';
import authService from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { loginSchema } from '../validations';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = Router();

router.post(
  '/login',
  validate(loginSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
        message: '登录成功',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
      });
    }
  }
);

router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '用户未认证',
        });
      }

      const user = await authService.getCurrentUser(req.user.userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败',
      });
    }
  }
);

export default router;
