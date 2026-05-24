import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: '缺少用户身份标识',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return res.status(401).json({
        code: 'INVALID_USER',
        message: '用户不存在',
        timestamp: new Date().toISOString()
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      code: 'AUTH_ERROR',
      message: '认证失败',
      timestamp: new Date().toISOString()
    });
  }
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: '权限不足',
        requiredRoles: roles,
        userRole: req.user.role,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};
