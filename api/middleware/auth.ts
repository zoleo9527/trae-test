import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../types.js';
import { ROLES } from '../types.js';

declare global {
  namespace Express {
    interface Request {
      actor?: { role: Role; name: string };
    }
  }
}

export function withActor(req: Request, res: Response, next: NextFunction) {
  const header = (req.headers['x-role'] as string) ?? 'manager';
  const role = (ROLES.find(r => r.key === header)?.key ?? 'manager') as Role;
  const name = ROLES.find(r => r.key === role)!.name;
  req.actor = { role, name };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.actor) return res.status(401).json({ error: 'missing actor' });
    if (!roles.includes(req.actor.role)) {
      return res.status(403).json({ error: '角色无权操作' });
    }
    next();
  };
}
