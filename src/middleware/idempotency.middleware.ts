import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';

export const extractIdempotencyKey = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const idempotencyKey = req.headers[IDEMPOTENCY_HEADER] as string;
  if (idempotencyKey) {
    req.idempotencyKey = idempotencyKey;
  }
  next();
};

export const checkIdempotency = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.idempotencyKey || !req.user) {
    return next();
  }

  try {
    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: {
        idempotencyKey: req.idempotencyKey,
      },
    });

    if (existingRecord) {
      if (existingRecord.userId !== req.user.userId) {
        return res.status(409).json({
          success: false,
          error: '幂等键已被其他用户使用',
        });
      }

      logger.info(`幂等请求命中: ${req.idempotencyKey}`);
      return res.status(existingRecord.statusCode).json(existingRecord.responseBody ? JSON.parse(existingRecord.responseBody) : null);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.idempotencyExpireHours);

    await prisma.idempotencyRecord.create({
      data: {
        idempotencyKey: req.idempotencyKey,
        userId: req.user.userId,
        endpoint: `${req.method} ${req.path}`,
        requestBody: req.body ? JSON.stringify(req.body) : null,
        statusCode: 202,
        expiresAt,
      },
    });

    const originalSend = res.json.bind(res);
    res.json = ((body: unknown) => {
      prisma.idempotencyRecord
        .update({
          where: { idempotencyKey: req.idempotencyKey },
          data: {
            responseBody: body ? JSON.stringify(body) : null,
            statusCode: res.statusCode,
          },
        })
        .catch((err) => logger.error('更新幂等记录失败', err));

      return originalSend(body);
    }) as typeof res.json;

    next();
  } catch (error) {
    logger.error('幂等检查失败', error);
    next(error);
  }
};

export const requireIdempotency = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers[IDEMPOTENCY_HEADER]) {
    return res.status(400).json({
      success: false,
      error: '缺少幂等键，请在请求头中提供 x-idempotency-key',
    });
  }
  next();
};
