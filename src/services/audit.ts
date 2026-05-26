import prisma from '../prisma';
import { AuditAction } from '../types';

interface AuditLogOptions {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  remark?: string;
  userId?: string;
}

export async function createAuditLog(options: AuditLogOptions) {
  const { entityType, entityId, action, oldValue, newValue, remark, userId } = options;

  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      remark,
      userId: userId || null,
    },
  });
}

export async function checkVersionConflict(
  model: any,
  id: string,
  expectedVersion: number
): Promise<boolean> {
  const record = await model.findUnique({
    where: { id },
    select: { version: true },
  });

  if (!record) return false;
  return record.version !== expectedVersion;
}

export async function createNotification(
  userIds: string[],
  title: string,
  content: string,
  type: string,
  relatedId?: string
) {
  const notifications = userIds.map((userId) => ({
    userId,
    title,
    content,
    type,
    relatedId: relatedId || null,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications,
    });
  }
}
