
import prisma from '../lib/prisma';
import { AuthUser } from '../types';
import logger from '../lib/logger';

export class AuditService {
  static async log(
    user: AuthUser,
    action: AuditAction,
    entityType: string,
    entityId: string,
    data?: {
      fieldName?: string;
      oldValue?: any;
      newValue?: any;
      remark?: string;
      ip?: string;
    }
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          fieldName: data?.fieldName,
          oldValue: data?.oldValue !== undefined ? JSON.stringify(data.oldValue) : undefined,
          newValue: data?.newValue !== undefined ? JSON.stringify(data.newValue) : undefined,
          operatorId: user.id,
          ip: data?.ip,
          remark: data?.remark,
        },
      });
      logger.info(`[Audit] ${user.name}(${user.role}) ${action} ${entityType}:${entityId}`);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }

  static async logChanges(
    user: AuthUser,
    action: AuditAction,
    entityType: string,
    entityId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ip?: string
  ) {
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of allKeys) {
      const oldVal = oldData[key];
      const newVal = newData[key];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        await this.log(user, action, entityType, entityId, {
          fieldName: key,
          oldValue: oldVal,
          newValue: newVal,
          ip,
        });
      }
    }
  }

  static async getEntityLogs(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        operator: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getUserLogs(userId: string, page: number = 1, pageSize: number = 50) {
    const skip = (page - 1) * pageSize;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { operatorId: userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { operatorId: userId } }),
    ]);

    return {
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
