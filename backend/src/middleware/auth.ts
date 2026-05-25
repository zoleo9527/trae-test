import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../types';

const JWT_SECRET = 'theater-ticket-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '认证令牌无效或已过期' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '未登录' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }

    next();
  };
}

export function generateToken(user: {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}
