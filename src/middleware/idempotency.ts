import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const EXPIRY_HOURS = 24;

export const idempotencyMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const idempotencyKey = req.header(IDEMPOTENCY_HEADER);
  
  if (!idempotencyKey) {
    return next();
  }

  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      const cachedResponse = JSON.parse(existing.response);
      return res.status(cachedResponse.status || 200).json(cachedResponse.body);
    }

    req.idempotencyKey = idempotencyKey;

    const originalJson = res.json.bind(res);
    let responseBody: any;

    res.json = (body: any) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on('finish', async () => {
      if (res.statusCode < 400) {
        try {
          await prisma.idempotencyKey.create({
            data: {
              key: idempotencyKey,
              response: JSON.stringify({
                status: res.statusCode,
                body: responseBody,
              }),
              expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
            },
          });
        } catch (err) {
          console.error('Failed to save idempotency key:', err);
        }
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};
