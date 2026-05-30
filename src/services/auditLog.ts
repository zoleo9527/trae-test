import { LogAction, LogModule } from '@prisma/client';
import prisma from '../lib/prisma';
import { JwtPayload } from '../types';

interface AuditLogParams {
  module: LogModule;
  action: LogAction;
  recordId: string;
  recordType: string;
  beforeState?: any;
  afterState?: any;
  remark?: string;
  evidenceData?: any;
  ipAddress?: string;
  userAgent?: string;
  user: JwtPayload;
}

export async function createAuditLog(params: AuditLogParams) {
  const {
    module,
    action,
    recordId,
    recordType,
    beforeState,
    afterState,
    remark,
    evidenceData,
    ipAddress,
    userAgent,
    user,
  } = params;

  return prisma.operationLog.create({
    data: {
      module,
      action,
      recordId,
      recordType,
      beforeState,
      afterState,
      remark,
      evidenceData,
      ipAddress,
      userAgent,
      createdById: user.userId,
    },
  });
}

export async function getAuditLogsByRecord(recordId: string, recordType?: string) {
  const where: any = { recordId };
  if (recordType) {
    where.recordType = recordType;
  }

  return prisma.operationLog.findMany({
    where,
    include: { createdBy: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
