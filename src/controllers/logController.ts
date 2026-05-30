import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, serverError, paginated } from '../utils/response';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, module, action, recordId, recordType, keyword } = req.query as any;

    const where: any = {};

    if (module) {
      where.module = module;
    }

    if (action) {
      where.action = action;
    }

    if (recordId) {
      where.recordId = recordId;
    }

    if (recordType) {
      where.recordType = recordType;
    }

    if (keyword) {
      where.remark = { contains: keyword };
    }

    const [total, logs] = await Promise.all([
      prisma.operationLog.count({ where }),
      prisma.operationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginated(res, logs, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getAuditLogDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const log = await prisma.operationLog.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!log) {
      return success(res, null, '日志不存在');
    }

    return success(res, log, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}
