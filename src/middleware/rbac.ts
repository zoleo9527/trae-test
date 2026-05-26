import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';

export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }

    const userRole = req.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ code: 403, message: '权限不足，无法执行此操作' });
    }

    next();
  };
}

export const ROLE_NAMES: Record<Role, string> = {
  [Role.SHOWROOM_MANAGER]: '展厅经理',
  [Role.SALES_CONSULTANT]: '销售顾问',
  [Role.INSTALL_COORDINATOR]: '安装协调',
};
