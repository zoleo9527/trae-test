import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { AuthenticatedRequest, JwtPayload, ROLE_HIERARCHY, Role, ROLE } from '../types';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在或已被禁用',
      });
    }

    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
    };

    logger.info(`用户认证成功: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    logger.error('认证失败', error);
    return res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    });
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '用户未认证',
      });
    }

    const userRoles = ROLE_HIERARCHY[req.user.role];
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      logger.warn(`权限不足: 用户 ${req.user.username} 角色 ${req.user.role} 尝试访问需要 ${allowedRoles} 的资源`);
      return res.status(403).json({
        success: false,
        error: '权限不足',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};
