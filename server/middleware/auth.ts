import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../src/types';

const JWT_SECRET = 'instrument-rental-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

export const generateToken = (user: {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
};
