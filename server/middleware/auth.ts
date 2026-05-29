import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, ErrorCodes, BusinessError, ROLE_PERMISSIONS } from '../types';
import { Role, OperationType } from '../types/enums';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new BusinessError(ErrorCodes.UNAUTHORIZED, '未提供有效认证令牌');
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    throw new BusinessError(ErrorCodes.INVALID_TOKEN, '认证令牌无效或已过期');
  }
}

export function requirePermission(operation: OperationType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user.role;
    const allowedOperations = ROLE_PERMISSIONS[userRole];
    
    if (!allowedOperations.includes(operation)) {
      throw new BusinessError(
        ErrorCodes.PERMISSION_DENIED,
        `当前角色 [${userRole}] 无权限执行 [${operation}] 操作`
      );
    }
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      throw new BusinessError(
        ErrorCodes.PERMISSION_DENIED,
        `需要角色 [${roles.join('/')}]，当前角色 [${req.user.role}]`
      );
    }
    next();
  };
}
