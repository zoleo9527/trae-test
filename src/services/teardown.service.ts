import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult, TeardownStatus, AuditAction, ProjectStatus } from '../types';
import { AuditService } from './audit.service';

export class TeardownService {
  static async create(user: AuthUser, data: {
    projectId: string;
    title: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    assigneeId?: string;
  }, ip?: string) {
    const teardown = await prisma.teardownReview.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        assigneeId: data.assigneeId,
        status: TeardownStatus.PENDING,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'TeardownReview', teardown.id, {
      remark: `创建撤场复盘: ${teardown.title}`,
      ip,
    });

    return teardown;
  }

  static async update(user: AuthUser, id: string, data: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    assigneeId?: string;
    issuesFound?: string;
    lessonsLearned?: string;
    finalReport?: string;
  }, ip?: string) {
    const existing = await prisma.teardownReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('撤场复盘不存在');
    }

    const oldData = {
      title: existing.title,
      description: existing.description,
      startDate: existing.startDate,
      endDate: existing.endDate,
      assigneeId: existing.assigneeId,
      issuesFound: existing.issuesFound,
      lessonsLearned: existing.lessonsLearned,
      finalReport: existing.finalReport,
    };

    const teardown = await prisma.teardownReview.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.logChanges(user, AuditAction.UPDATE, 'TeardownReview', id, oldData, data, ip);

    return teardown;
  }

  static async startProgress(user: AuthUser, id: string, ip?: string) {
    const existing = await prisma.teardownReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('撤场复盘不存在');
    }

    const teardown = await prisma.teardownReview.update({
      where: { id },
      data: { status: TeardownStatus.IN_PROGRESS },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.UPDATE, 'TeardownReview', id, {
      fieldName: 'status',
      oldValue: existing.status,
      newValue: TeardownStatus.IN_PROGRESS,
      remark: '开始撤场',
      ip,
    });

    return teardown;
  }

  static async markMaterialsReturned(user: AuthUser, id: string, ip?: string) {
    const existing = await prisma.teardownReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('撤场复盘不存在');
    }

    const teardown = await prisma.teardownReview.update({
      where: { id },
      data: { materialsReturned: true },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.UPDATE, 'TeardownReview', id, {
      fieldName: 'materialsReturned',
      oldValue: 'false',
      newValue: 'true',
      remark: '物料已归还',
      ip,
    });

    return teardown;
  }

  static async markSiteCleared(user: AuthUser, id: string, ip?: string) {
    const existing = await prisma.teardownReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('撤场复盘不存在');
    }

    const teardown = await prisma.teardownReview.update({
      where: { id },
      data: { siteCleared: true },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.UPDATE, 'TeardownReview', id, {
      fieldName: 'siteCleared',
      oldValue: 'false',
      newValue: 'true',
      remark: '场地已清场',
      ip,
    });

    return teardown;
  }

  static async complete(user: AuthUser, id: string, ip?: string) {
    const existing = await prisma.teardownReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('撤场复盘不存在');
    }

    const teardown = await prisma.teardownReview.update({
      where: { id },
      data: { status: TeardownStatus.COMPLETED, completedAt: new Date() },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.COMPLETE, 'TeardownReview', id, {
      oldValue: existing.status,
      newValue: TeardownStatus.COMPLETED,
      remark: '撤场复盘完成',
      ip,
    });

    await prisma.project.update({
      where: { id: existing.projectId },
      data: { status: ProjectStatus.COMPLETED },
    });

    await AuditService.log(user, AuditAction.COMPLETE, 'Project', existing.projectId, {
      remark: '撤场完成，项目自动结案',
      ip,
    });

    return teardown;
  }

  static async getById(user: AuthUser, id: string) {
    const teardown = await prisma.teardownReview.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    if (!teardown) {
      throw new Error('撤场复盘不存在');
    }

    const [auditLogs, comments] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: 'TeardownReview', entityId: id },
        include: { operator: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.findMany({
        where: { entityType: 'TeardownReview', entityId: id },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      ...teardown,
      auditLogs,
      comments,
    };
  }

  static async getList(
    user: AuthUser,
    params: {
      projectId?: string;
      status?: TeardownStatus;
      assigneeId?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResult<any>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.projectId) where.projectId = params.projectId;
    if (params.status) where.status = params.status;
    if (params.assigneeId) where.assigneeId = params.assigneeId;

    const [items, total] = await Promise.all([
      prisma.teardownReview.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, code: true, name: true } },
          assignee: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teardownReview.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
