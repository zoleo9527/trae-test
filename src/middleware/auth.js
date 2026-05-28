import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AuthenticationError('请提供访问令牌');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        department: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('用户不存在');
    }

    if (!user.isActive) {
      throw new AuthenticationError('账户已被禁用');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('请先登录');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError(`此操作需要 ${roles.join(' / ')} 角色权限`);
    }

    next();
  };
};

const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('请先登录');
    }

    const hasPermission = roles.some(role => req.user.role === role);
    if (!hasPermission) {
      throw new AuthorizationError('权限不足');
    }

    next();
  };
};

export { authMiddleware, requireRole, requireAnyRole };
