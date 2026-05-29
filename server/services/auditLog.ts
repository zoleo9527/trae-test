import { Request } from 'express';
import prisma from '../utils/prisma';
import { OperationType } from '../types/enums';
import { JwtPayload } from '../types';
import { OperationLog } from '@prisma/client';

export interface LogContext {
  inquiryId?: string;
  stockLockId?: string;
  returnOrderId?: string;
  refundOrderId?: string;
  oldStatus?: string;
  newStatus?: string;
  detail?: Record<string, unknown>;
}

export async function createOperationLog(
  user: JwtPayload,
  operationType: OperationType,
  context: LogContext,
  req?: Request
): Promise<OperationLog> {
  return prisma.operationLog.create({
    data: {
      operationType,
      operatorId: user.userId,
      operatorName: user.realName,
      operatorRole: user.role,
      ipAddress: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.headers['user-agent'],
      detail: context.detail ? JSON.stringify(context.detail) : null,
      oldStatus: context.oldStatus,
      newStatus: context.newStatus,
      inquiryId: context.inquiryId,
      stockLockId: context.stockLockId,
      returnOrderId: context.returnOrderId,
      refundOrderId: context.refundOrderId,
    },
  });
}

export async function getOperationLogsByInquiry(
  inquiryId: string
): Promise<OperationLog[]> {
  return prisma.operationLog.findMany({
    where: {
      OR: [
        { inquiryId },
        { stockLock: { inquiryId } },
        { returnOrder: { inquiryId } },
        { refundOrder: { inquiryId } },
      ],
    },
    orderBy: { createdAt: 'desc' as const },
    include: {
      inquiry: { select: { inquiryNo: true } },
      stockLock: { select: { lockNo: true } },
      returnOrder: { select: { returnNo: true } },
      refundOrder: { select: { refundNo: true } },
    },
  });
}

export async function getOperationLogs(
  filters: {
    operatorId?: string;
    operationType?: OperationType;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const { operatorId, operationType, startDate, endDate, page = 1, pageSize = 20 } = filters;
  
  const where: any = {};
  if (operatorId) where.operatorId = operatorId;
  if (operationType) where.operationType = operationType;
  if (startDate || endDate) {
    where.createdAt = {} as Record<string, Date>;
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  const [total, items] = await Promise.all([
    prisma.operationLog.count({ where }),
    prisma.operationLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' as const },
    }),
  ]);

  return { total, items, page, pageSize };
}
