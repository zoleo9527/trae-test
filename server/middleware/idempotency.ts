import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { ErrorCodes, BusinessError } from '../types';

const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';

export async function idempotency(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  const idempotencyKey = req.headers[IDEMPOTENCY_HEADER.toLowerCase()] as string;
  if (!idempotencyKey) {
    (req as unknown as Record<string, unknown>).idempotencyKey = uuidv4();
    return next();
  }

  const existing = await prisma.inquiry.findFirst({
    where: { idempotencyKey },
    select: { id: true, inquiryNo: true, updatedAt: true },
  });

  if (existing) {
    throw new BusinessError(
      ErrorCodes.IDEMPOTENT_DUPLICATE,
      '重复请求检测，该幂等键已处理过',
      { existingRecord: existing }
    );
  }

  const existingReturn = await prisma.returnOrder.findFirst({
    where: { idempotencyKey },
    select: { id: true, returnNo: true },
  });

  if (existingReturn) {
    throw new BusinessError(
      ErrorCodes.IDEMPOTENT_DUPLICATE,
      '重复请求检测，该幂等键已处理过',
      { existingRecord: existingReturn }
    );
  }

  const existingRefund = await prisma.refundOrder.findFirst({
    where: { idempotencyKey },
    select: { id: true, refundNo: true },
  });

  if (existingRefund) {
    throw new BusinessError(
      ErrorCodes.IDEMPOTENT_DUPLICATE,
      '重复请求检测，该幂等键已处理过',
      { existingRecord: existingRefund }
    );
  }

  (req as unknown as Record<string, unknown>).idempotencyKey = idempotencyKey;
  next();
}
