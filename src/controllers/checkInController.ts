import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, error, notFound, serverError, paginated } from '../utils/response';
import { createAuditLog } from '../services/auditLog';
import { LogAction, LogModule, CheckInStatus, RegistrationStatus } from '@prisma/client';

export async function createCheckIn(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId, registrationId, userName, userPhone, checkInMethod, evidenceImage, manualRemark } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return notFound(res, '活动不存在');
    }

    let registration = null;
    if (registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        return notFound(res, '报名记录不存在');
      }

      if (registration.activityId !== activityId) {
        return error(res, '报名记录不属于该活动', 400);
      }

      if (registration.status === RegistrationStatus.CHECKED_IN) {
        return error(res, '已签到，请勿重复签到', 400);
      }

      if (registration.status !== RegistrationStatus.APPROVED) {
        return error(res, '报名未通过审核，无法签到', 400);
      }
    }

    const checkIn = await prisma.$transaction(async (tx) => {
      const record = await tx.checkInRecord.create({
        data: {
          activityId,
          registrationId,
          userName,
          userPhone,
          checkInTime: new Date(),
          status: checkInMethod === 'MANUAL' ? CheckInStatus.MANUAL : CheckInStatus.SUCCESS,
          checkInMethod,
          handledById: req.user!.userId,
          evidenceImage,
          manualRemark,
        },
        include: {
          activity: { select: { id: true, title: true } },
          registration: true,
        },
      });

      if (registrationId) {
        await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: RegistrationStatus.CHECKED_IN,
            checkInId: record.id,
          },
        });
      }

      return record;
    });

    await createAuditLog({
      module: LogModule.CHECK_IN,
      action: LogAction.CHECK_IN,
      recordId: checkIn.id,
      recordType: 'CheckInRecord',
      afterState: checkIn,
      remark: `${checkInMethod === 'MANUAL' ? '人工' : '扫码'}签到成功`,
      evidenceData: { evidenceImage, manualRemark },
      user: req.user,
    });

    return success(res, checkIn, '签到成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function manualCheckIn(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId, registrationId, userName, userPhone, manualRemark, evidenceImage } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return notFound(res, '活动不存在');
    }

    let registration = null;
    if (registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
      });

      if (registration && registration.status === RegistrationStatus.CHECKED_IN) {
        return error(res, '已签到，请勿重复签到', 400);
      }
    }

    const checkIn = await prisma.$transaction(async (tx) => {
      const record = await tx.checkInRecord.create({
        data: {
          activityId,
          registrationId,
          userName,
          userPhone,
          checkInTime: new Date(),
          status: CheckInStatus.MANUAL,
          checkInMethod: 'MANUAL',
          handledById: req.user!.userId,
          manualRemark,
          evidenceImage,
        },
        include: {
          activity: { select: { id: true, title: true } },
          handledBy: { select: { id: true, name: true } },
        },
      });

      if (registrationId && registration) {
        await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: RegistrationStatus.CHECKED_IN,
            checkInId: record.id,
          },
        });
      }

      return record;
    });

    await createAuditLog({
      module: LogModule.CHECK_IN,
      action: LogAction.CHECK_IN,
      recordId: checkIn.id,
      recordType: 'CheckInRecord',
      afterState: checkIn,
      remark: `人工签到: ${manualRemark}`,
      evidenceData: { evidenceImage, manualRemark },
      user: req.user,
    });

    return success(res, checkIn, '人工签到成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getCheckInList(req: AuthRequest, res: Response) {
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

    const [total, checkIns] = await Promise.all([
      prisma.checkInRecord.count({ where }),
      prisma.checkInRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          activity: { select: { id: true, title: true, startTime: true } },
          registration: true,
          handledBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { checkInTime: 'desc' },
      }),
    ]);

    return paginated(res, checkIns, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getCheckInDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const checkIn = await prisma.checkInRecord.findUnique({
      where: { id },
      include: {
        activity: {
          include: { library: { select: { id: true, name: true } } },
        },
        registration: true,
        handledBy: { select: { id: true, name: true, role: true } },
        operationLogs: {
          include: { createdBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!checkIn) {
      return notFound(res, '签到记录不存在');
    }

    return success(res, checkIn, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function markNoShow(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { registrationId } = req.params;
    const { remark } = req.body;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return notFound(res, '报名记录不存在');
    }

    if (registration.status === RegistrationStatus.CHECKED_IN) {
      return error(res, '已签到，无法标记为未到', 400);
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.NO_SHOW },
      include: { activity: { select: { id: true, title: true } } },
    });

    await createAuditLog({
      module: LogModule.REGISTRATION,
      action: LogAction.UPDATE,
      recordId: registrationId,
      recordType: 'Registration',
      beforeState: { status: registration.status },
      afterState: { status: RegistrationStatus.NO_SHOW },
      remark: `标记为未到: ${remark || '未到场'}`,
      user: req.user,
    });

    return success(res, updated, '标记成功');
  } catch (err) {
    return serverError(res, err);
  }
}
