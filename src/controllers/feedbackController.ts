import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, error, notFound, forbidden, serverError, paginated } from '../utils/response';
import { createAuditLog } from '../services/auditLog';
import { LogAction, LogModule } from '@prisma/client';
import { CreateFeedbackInput, ResolveFeedbackInput } from '../schemas/feedback';

export async function createFeedback(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId, content, rating } = req.body as CreateFeedbackInput;

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return notFound(res, '活动不存在');
    }

    const feedback = await prisma.volunteerFeedback.create({
      data: {
        activityId,
        volunteerId: req.user.userId,
        content,
        rating,
      },
      include: {
        activity: { select: { id: true, title: true } },
        volunteer: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      module: LogModule.ACTIVITY,
      action: LogAction.CREATE,
      recordId: feedback.id,
      recordType: 'VolunteerFeedback',
      afterState: { activityId, content, rating },
      remark: '提交志愿者反馈',
      user: req.user,
    });

    return success(res, feedback, '反馈提交成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getFeedbackList(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, activityId, volunteerId, isResolved, keyword } = req.query as any;

    const where: any = {};

    if (activityId) {
      where.activityId = activityId;
    }

    if (volunteerId) {
      where.volunteerId = volunteerId;
    }

    if (isResolved !== undefined) {
      where.isResolved = isResolved;
    }

    if (keyword) {
      where.content = { contains: keyword };
    }

    if (req.user!.role === 'VOLUNTEER') {
      where.volunteerId = req.user!.userId;
    }

    const [total, feedbacks] = await Promise.all([
      prisma.volunteerFeedback.count({ where }),
      prisma.volunteerFeedback.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          activity: { select: { id: true, title: true } },
          volunteer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginated(res, feedbacks, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getFeedbackDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const feedback = await prisma.volunteerFeedback.findUnique({
      where: { id },
      include: {
        activity: { select: { id: true, title: true } },
        volunteer: { select: { id: true, name: true } },
      },
    });

    if (!feedback) {
      return notFound(res, '反馈不存在');
    }

    if (req.user!.role === 'VOLUNTEER' && feedback.volunteerId !== req.user!.userId) {
      return forbidden(res, '只能查看自己的反馈');
    }

    return success(res, feedback, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function resolveFeedback(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { id } = req.params;
    const { resolution } = req.body as ResolveFeedbackInput;

    const existing = await prisma.volunteerFeedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFound(res, '反馈不存在');
    }

    if (existing.isResolved) {
      return error(res, '该反馈已处理', 400);
    }

    const feedback = await prisma.volunteerFeedback.update({
      where: { id },
      data: {
        isResolved: true,
        resolverId: req.user.userId,
        resolvedAt: new Date(),
        resolution,
      },
      include: {
        activity: { select: { id: true, title: true } },
        volunteer: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      module: LogModule.ACTIVITY,
      action: LogAction.UPDATE,
      recordId: feedback.id,
      recordType: 'VolunteerFeedback',
      beforeState: { isResolved: false },
      afterState: { isResolved: true, resolution },
      remark: `处理志愿者反馈: ${resolution}`,
      user: req.user,
    });

    return success(res, feedback, '反馈处理成功');
  } catch (err) {
    return serverError(res, err);
  }
}
