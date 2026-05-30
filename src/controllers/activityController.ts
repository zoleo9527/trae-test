import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, error, notFound, serverError, paginated } from '../utils/response';
import { createAuditLog } from '../services/auditLog';
import { LogAction, LogModule, ActivityStatus } from '@prisma/client';
import { CreateActivityInput, UpdateActivityInput, ActivityFilterInput } from '../schemas/activity';

export async function createActivity(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const data = req.body as CreateActivityInput;

    if (data.startTime >= data.endTime) {
      return error(res, '活动开始时间必须早于结束时间', 400);
    }

    if (data.registrationStart >= data.registrationEnd) {
      return error(res, '报名开始时间必须早于报名结束时间', 400);
    }

    const library = await prisma.library.findUnique({
      where: { id: data.libraryId },
    });

    if (!library) {
      return error(res, '书房不存在', 400);
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        createdById: req.user.userId,
      },
      include: {
        library: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      module: LogModule.ACTIVITY,
      action: LogAction.CREATE,
      recordId: activity.id,
      recordType: 'Activity',
      afterState: activity,
      remark: '创建活动',
      user: req.user,
    });

    return success(res, activity, '活动创建成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getActivityList(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, libraryId, status, keyword, startDate, endDate } = req.query as any;

    const where: any = {};

    if (libraryId) {
      where.libraryId = libraryId;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endTime = { lte: new Date(endDate) };
    }

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          library: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { registrations: true, checkInRecords: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginated(res, activities, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getActivityDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        library: { select: { id: true, name: true, address: true } },
        createdBy: { select: { id: true, name: true } },
        registrations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        checkInRecords: {
          take: 10,
          orderBy: { checkInTime: 'desc' },
        },
        operationLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!activity) {
      return notFound(res, '活动不存在');
    }

    return success(res, activity, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function updateActivity(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;
    const data = req.body as UpdateActivityInput;

    const existing = await prisma.activity.findUnique({ where: { id } });

    if (!existing) {
      return notFound(res, '活动不存在');
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        updatedById: req.user.userId,
      },
      include: {
        library: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      module: LogModule.ACTIVITY,
      action: LogAction.UPDATE,
      recordId: activity.id,
      recordType: 'Activity',
      beforeState: existing,
      afterState: activity,
      remark: '更新活动信息',
      user: req.user,
    });

    return success(res, activity, '活动更新成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function updateActivityStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.activity.findUnique({ where: { id } });

    if (!existing) {
      return notFound(res, '活动不存在');
    }

    const validStatuses = Object.values(ActivityStatus);
    if (!validStatuses.includes(status)) {
      return error(res, '无效的活动状态', 400);
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        status,
        updatedById: req.user.userId,
      },
    });

    await createAuditLog({
      module: LogModule.ACTIVITY,
      action: LogAction.UPDATE,
      recordId: activity.id,
      recordType: 'Activity',
      beforeState: { status: existing.status },
      afterState: { status: activity.status },
      remark: `更新活动状态: ${existing.status} -> ${status}`,
      user: req.user,
    });

    return success(res, activity, '状态更新成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function deleteActivity(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;

    const existing = await prisma.activity.findUnique({ where: { id } });

    if (!existing) {
      return notFound(res, '活动不存在');
    }

    const hasRegistrations = await prisma.registration.count({
      where: { activityId: id },
    });

    if (hasRegistrations > 0) {
      return error(res, '活动已有报名记录，无法删除', 400);
    }

    await prisma.activity.delete({ where: { id } });

    await createAuditLog({
      module: LogModule.ACTIVITY,
      action: LogAction.DELETE,
      recordId: id,
      recordType: 'Activity',
      beforeState: existing,
      remark: '删除活动',
      user: req.user,
    });

    return success(res, null, '活动删除成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getActivityStats(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const [registrations, approved, checkedIn, noShows] = await Promise.all([
      prisma.registration.count({ where: { activityId: id } }),
      prisma.registration.count({ where: { activityId: id, status: 'APPROVED' } }),
      prisma.registration.count({ where: { activityId: id, status: 'CHECKED_IN' } }),
      prisma.registration.count({ where: { activityId: id, status: 'NO_SHOW' } }),
    ]);

    return success(
      res,
      {
        totalRegistrations: registrations,
        approvedCount: approved,
        checkedInCount: checkedIn,
        noShowCount: noShows,
        attendanceRate: approved > 0 ? Math.round((checkedIn / approved) * 100) : 0,
      },
      '获取成功'
    );
  } catch (err) {
    return serverError(res, err);
  }
}
