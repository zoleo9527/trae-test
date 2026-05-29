import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { AuthenticatedRequest, AuditLogData, AuditAction, AUDIT_ACTION } from '../types';

export const createAuditLog = async (data: AuditLogData) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        previousValue: data.previousValue ? JSON.stringify(data.previousValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        changeSummary: data.changeSummary,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    logger.debug(`审计日志已记录: ${data.action} ${data.entityType} ${data.entityId}`);
  } catch (error) {
    logger.error('记录审计日志失败', error);
  }
};

export const auditAction = (
  action: AuditAction,
  entityType: string,
  getEntityId: (req: AuthenticatedRequest) => string,
  getChangeSummary?: (req: AuthenticatedRequest, res: Response) => string
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next();
    }

    const entityId = getEntityId(req);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const originalSend = res.json.bind(res);
    let responseBody: unknown;

    res.json = ((body: unknown) => {
      responseBody = body;
      return originalSend(body);
    }) as typeof res.json;

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const changeSummary = getChangeSummary
          ? getChangeSummary(req, res)
          : `${req.user!.username} 执行了 ${action} 操作`;

        await createAuditLog({
          userId: req.user!.userId,
          action,
          entityType,
          entityId,
          newValue: responseBody ? JSON.stringify(responseBody) : null,
          changeSummary,
          ipAddress,
          userAgent,
        });
      }
    });

    next();
  };
};

export const trackChanges = <T>(
  oldValue: T,
  newValue: Partial<T>
): { changed: boolean; changes: Partial<T>; summary: string } => {
  const changes: Partial<T> = {};
  const summaries: string[] = [];

  for (const key of Object.keys(newValue) as (keyof T)[]) {
    if (oldValue[key] !== newValue[key]) {
      changes[key] = newValue[key];
      summaries.push(`${String(key)}: ${oldValue[key]} → ${newValue[key]}`);
    }
  }

  return {
    changed: Object.keys(changes).length > 0,
    changes,
    summary: summaries.join(', '),
  };
};
