import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth';

export const idempotency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  if (!req.user) {
    return next();
  }

  const userId = req.user.id;

  try {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: {
        id_userId: {
          id: idempotencyKey,
          userId
        }
      }
    });

    if (existing) {
      return res.status(200).json(JSON.parse(existing.response));
    }

    const originalJson = res.json.bind(res);
    (res as any).json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        prisma.idempotencyRecord.create({
          data: {
            id: idempotencyKey,
            userId,
            endpoint: req.path,
            response: JSON.stringify(body),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        }).catch(console.error);
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    next();
  }
};
