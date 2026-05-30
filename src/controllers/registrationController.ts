import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, error, notFound, serverError, paginated } from '../utils/response';
import { createAuditLog } from '../services/auditLog';
import { LogAction, LogModule, RegistrationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export async function createRegistration(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId, userId, userName, userPhone, idCardNumber } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] as string || uuidv4();

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return notFound(res, '活动不存在');
    }

    if (activity.status !== 'REGISTRATION_OPEN') {
      return error(res, '活动不在报名期内', 400);
    }

    const existing = await prisma.registration.findUnique({
      where: {
        activityId_userId: { activityId, userId },
      },
    });

    if (existing) {
      return error(res, '您已报名该活动', 400);
    }

    if (activity.currentParticipants >= activity.maxParticipants) {
      return error(res, '活动报名人数已满', 400);
    }

    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          activityId,
          userId,
          userName,
          userPhone,
          idCardNumber,
          status: RegistrationStatus.PENDING,
          idempotencyKey,
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
      });

      await tx.activity.update({
        where: { id: activityId },
        data: { currentParticipants: { increment: 1 } },
      });

      return reg;
    });

    await createAuditLog({
      module: LogModule.REGISTRATION,
      action: LogAction.CREATE,
      recordId: registration.id,
      recordType: 'Registration',
      afterState: registration,
      remark: '用户报名活动',
      user: req.user,
    });

    return success(res, registration, '报名成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getRegistrationList(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, activityId, status, keyword } = req.query as any;

    const where: any = {};

    if (activityId) {
      where.activityId = activityId;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { userName: { contains: keyword } },
        { userPhone: { contains: keyword } },
      ];
    }

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          activity: { select: { id: true, title: true, startTime: true } },
          checkIn: true,
          managedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginated(res, registrations, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getRegistrationDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        activity: {
          include: { library: { select: { id: true, name: true } } },
        },
        checkIn: true,
        operationLogs: {
          include: { createdBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!registration) {
      return notFound(res, '报名记录不存在');
    }

    return success(res, registration, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function approveRegistration(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;

    const existing = await prisma.registration.findUnique({
      where: { id },
      include: { activity: true },
    });

    if (!existing) {
      return notFound(res, '报名记录不存在');
    }

    if (existing.status !== RegistrationStatus.PENDING) {
      return error(res, '只有待审核状态才能审批', 400);
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: { status: RegistrationStatus.APPROVED },
      include: { activity: { select: { id: true, title: true } } },
    });

    await createAuditLog({
      module: LogModule.REGISTRATION,
      action: LogAction.APPROVE,
      recordId: registration.id,
      recordType: 'Registration',
      beforeState: { status: existing.status },
      afterState: { status: registration.status },
      remark: '审核通过报名',
      user: req.user,
    });

    return success(res, registration, '审核通过');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function rejectRegistration(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;
    const { rejectReason } = req.body;

    const existing = await prisma.registration.findUnique({
      where: { id },
      include: { activity: true },
    });

    if (!existing) {
      return notFound(res, '报名记录不存在');
    }

    if (existing.status !== RegistrationStatus.PENDING) {
      return error(res, '只有待审核状态才能驳回', 400);
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        status: RegistrationStatus.REJECTED,
        rejectReason,
        rejectById: req.user.userId,
        rejectTime: new Date(),
      },
      include: { activity: { select: { id: true, title: true } } },
    });

    await createAuditLog({
      module: LogModule.REGISTRATION,
      action: LogAction.REJECT,
      recordId: registration.id,
      recordType: 'Registration',
      beforeState: { status: existing.status },
      afterState: { status: registration.status, rejectReason },
      remark: `驳回报名: ${rejectReason}`,
      user: req.user,
    });

    return success(res, registration, '驳回成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function cancelRegistration(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const existing = await prisma.registration.findUnique({
      where: { id },
      include: { activity: true },
    });

    if (!existing) {
      return notFound(res, '报名记录不存在');
    }

    if (existing.status === RegistrationStatus.CANCELLED) {
      return error(res, '报名已取消', 400);
    }

    if (existing.status === RegistrationStatus.CHECKED_IN) {
      return error(res, '已签到，无法取消', 400);
    }

    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.update({
        where: { id },
        data: {
          status: RegistrationStatus.CANCELLED,
          cancelReason,
          cancelTime: new Date(),
        },
      });

      await tx.activity.update({
        where: { id: existing.activityId },
        data: { currentParticipants: { decrement: 1 } },
      });

      return reg;
    });

    return success(res, registration, '取消成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function supplementRegistration(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId, userId, userName, userPhone, idCardNumber, supplementReason } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return notFound(res, '活动不存在');
    }

    const existing = await prisma.registration.findUnique({
      where: {
        activityId_userId: { activityId, userId },
      },
    });

    if (existing) {
      return error(res, '该用户已报名该活动', 400);
    }

    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          activityId,
          userId,
          userName,
          userPhone,
          idCardNumber,
          status: RegistrationStatus.APPROVED,
          isSupplement: true,
          supplementReason,
          supplementById: req.user!.userId,
          supplementTime: new Date(),
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
      });

      await tx.activity.update({
        where: { id: activityId },
        data: { currentParticipants: { increment: 1 } },
      });

      return reg;
    });

    await createAuditLog({
      module: LogModule.REGISTRATION,
      action: LogAction.SUPPLEMENT,
      recordId: registration.id,
      recordType: 'Registration',
      afterState: registration,
      remark: `补录报名: ${supplementReason}`,
      user: req.user,
    });

    return success(res, registration, '补录成功');
  } catch (err) {
    return serverError(res, err);
  }
}
