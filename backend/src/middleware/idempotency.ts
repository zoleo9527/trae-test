import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { config } from '../config';
import { serializeJson, deserializeJson } from '../utils/transform';

export function generateRequestHash(req: Request): string {
  const data = {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    userId: req.user?.userId,
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  (async () => {
    try {
      const requestHash = generateRequestHash(req);
      const existing = await prisma.idempotentRecord.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        if (existing.requestHash === requestHash) {
          return res.status(200).json({
            code: 0,
            message: '请求已处理（幂等返回）',
            data: deserializeJson(existing.responseData),
            idempotent: true,
            traceId: req.context.traceId,
          });
        } else {
          return res.status(409).json({
            code: 409,
            message: '幂等键已存在但请求内容不匹配',
            traceId: req.context.traceId,
          });
        }
      }

      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const expiresAt = new Date();
          expiresAt.setHours(
            expiresAt.getHours() + config.idempotency.expireHours
          );

          await prisma.idempotentRecord.create({
            data: {
              idempotencyKey,
              userId: req.user?.userId || '',
              operation: `${req.method} ${req.path}`,
              requestHash,
              expiresAt,
            },
          });
        }
      });

      next();
    } catch (error) {
      next(error);
    }
  })();
}
