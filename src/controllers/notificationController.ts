import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, error, notFound, forbidden, serverError, paginated } from '../utils/response';
import { createAuditLog } from '../services/auditLog';
import { LogAction, LogModule } from '@prisma/client';
import { SendNotificationInput } from '../schemas/notification';

export async function sendNotification(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { type, title, content, recipientId, recipientPhone, relatedRecordId, relatedRecordType } = req.body as SendNotificationInput;

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      return notFound(res, '接收人不存在');
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        recipientId,
        recipientPhone: recipientPhone || recipient.phone,
        sentById: req.user.userId,
        isSent: true,
        sendAttempts: 1,
        lastAttemptAt: new Date(),
        relatedRecordId,
        relatedRecordType,
      },
      include: {
        sentBy: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      module: LogModule.NOTIFICATION,
      action: LogAction.CREATE,
      recordId: notification.id,
      recordType: 'Notification',
      afterState: { type, title, recipientId, isSent: true },
      remark: `发送通知: ${title}`,
      user: req.user,
    });

    return success(res, notification, '通知发送成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getNotificationList(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, type, isRead, isSent, recipientId, keyword } = req.query as any;

    const where: any = {};

    if (req.user!.role === 'VOLUNTEER') {
      where.recipientId = req.user!.userId;
    } else if (recipientId) {
      where.recipientId = recipientId;
    }

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (isSent !== undefined) {
      where.isSent = isSent;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sentBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginated(res, notifications, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getNotificationDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        sentBy: { select: { id: true, name: true } },
      },
    });

    if (!notification) {
      return notFound(res, '通知不存在');
    }

    if (req.user!.role === 'VOLUNTEER' && notification.recipientId !== req.user!.userId) {
      return forbidden(res, '只能查看自己的通知');
    }

    return success(res, notification, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return notFound(res, '通知不存在');
    }

    if (notification.recipientId !== req.user.userId && req.user.role !== 'DIRECTOR') {
      return error(res, '只能标记自己的通知', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return success(res, updated, '标记已读成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function resendNotification(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return notFound(res, '通知不存在');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isSent: true,
        sendAttempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    await createAuditLog({
      module: LogModule.NOTIFICATION,
      action: LogAction.REMIND,
      recordId: id,
      recordType: 'Notification',
      beforeState: { sendAttempts: notification.sendAttempts, isSent: notification.isSent },
      afterState: { sendAttempts: updated.sendAttempts, isSent: true },
      remark: `重发通知: ${notification.title}`,
      user: req.user,
    });

    return success(res, updated, '重发成功');
  } catch (err) {
    return serverError(res, err);
  }
}
