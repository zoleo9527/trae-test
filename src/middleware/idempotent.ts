import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { error } from '../utils/response';
import prisma from '../lib/prisma';
import { addHours } from 'date-fns';

const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';

export function idempotent(req: AuthRequest, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER] as string;

  if (!idempotencyKey) {
    return next();
  }

  if (!req.user) {
    return next();
  }

  processIdempotentRequest(req, res, next, idempotencyKey);
}

async function processIdempotentRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  idempotencyKey: string
) {
  try {
    const existing = await prisma.idempotentRequest.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return res.status(existing.statusCode).json(existing.responseData);
    }

    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      (async () => {
        try {
          await prisma.idempotentRequest.create({
            data: {
              idempotencyKey,
              userId: req.user!.userId,
              path: req.path,
              method: req.method,
              requestBody: req.body,
              responseData: body,
              statusCode: res.statusCode,
              expiresAt: addHours(new Date(), 24),
            },
          });
        } catch (e) {
          console.error('Failed to save idempotent request:', e);
        }
      })();

      return originalJson(body);
    };

    next();
  } catch (error) {
    next();
  }
}

export function requireIdempotencyKey(req: AuthRequest, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER] as string;

  if (!idempotencyKey) {
    return error(res, '缺少幂等性请求头 x-idempotency-key', 400);
  }

  next();
}
