import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import { unauthorized, forbidden } from '../utils/response';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return unauthorized(res, 'Token无效或已过期');
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return unauthorized(res);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res);
    }

    next();
  };
}

export function requireDirector(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(Role.DIRECTOR)(req, res, next);
}

export function requireActivityOperator(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(Role.DIRECTOR, Role.ACTIVITY_OPERATOR)(req, res, next);
}

export function requireVolunteerCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(Role.DIRECTOR, Role.VOLUNTEER_COORDINATOR)(req, res, next);
}
