import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/prisma';
import { Role, Permission } from '../types/enums';
import { deserializePermissions } from '../utils/transform';

export interface AuthPayload {
  userId: string;
  username: string;
  role: Role;
  permissions: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        traceId: req.context.traceId,
      });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
      select: { id: true, username: true, role: true, permissions: true },
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已禁用',
        traceId: req.context.traceId,
      });
    }

    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
      permissions: deserializePermissions(user.permissions),
    };

    req.context.userId = user.id;
    req.context.userRole = user.role;

    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '认证令牌无效或已过期',
      traceId: req.context.traceId,
    });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
        traceId: req.context.traceId,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，需要角色: ' + roles.join(', '),
        traceId: req.context.traceId,
      });
    }

    next();
  };
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
        traceId: req.context.traceId,
      });
    }

    const hasPermission = permissions.some((p) =>
      req.user!.permissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，需要权限: ' + permissions.join(', '),
        traceId: req.context.traceId,
      });
    }

    next();
  };
}
