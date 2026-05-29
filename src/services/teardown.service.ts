import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult, Role, TeardownStatus, AuditAction, ProjectStatus } from '../types';
import { AuditService } from './audit.service';

export class TeardownService {
  private static async getUserSupplierIds(user: AuthUser): Promise<string[]> {
    if (user.role !== Role.SUPPLIER_CONTACT) return [];

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { supplierId: true },
    });

    return fullUser?.supplierId ? [fullUser.supplierId] : [];
  }

  static canCreate(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canUpdate(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canStart(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canMarkMaterialsReturned(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canMarkSiteCleared(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canComplete(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR] as Role[]).includes(user.role);
  }

  private static async getAccessibleTeardownIds(user: AuthUser): Promise<string[]> {
    if (([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE, Role.FINANCE] as Role[]).includes(user.role)) {
      return [];
    }

    const supplierIds = await this.getUserSupplierIds(user);
    if (supplierIds.length === 0) return ['__no_access__'];

    const teardowns = await prisma.teardownReview.findMany({
      where: {
        project: {
          suppliers: {
            some: { supplierId: { in: supplierIds } },
          },
        },
      },
      select: { id: true },
    });

    return teardowns.map(t => t.id);
  }

  private static getSelectFieldsByRole(role: Role) {
    const base = {
      id: true,
      title: true,
      description: true,
      projectId: true,
      status: true,
      startDate: true,
      endDate: true,
      assigneeId: true,
      issuesFound: true,
      lessonsLearned: true,
      finalReport: true,
      materialsReturned: true,
      siteCleared: true,
      createdAt: true,
      completedAt: true,
      project: { select: { id: true, code: true, name: true } },
      assignee: { select: { id: true, name: true, role: true } },
    };

    return base;
  }

  static async create(user: AuthUser, data: {
    projectId: string;
    title: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    assigneeId?: string;
  }, ip?: string) {
    if (!this.canCreate(user)) throw new Error('无权创建撤场复盘');

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
    if (!this.canUpdate(user)) throw new Error('无权修改撤场复盘');
    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此撤场复盘');

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
    if (!this.canStart(user)) throw new Error('无权开始撤场');
    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此撤场复盘');

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
    if (!this.canMarkMaterialsReturned(user)) throw new Error('无权标记物料已归还');
    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此撤场复盘');

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
    if (!this.canMarkSiteCleared(user)) throw new Error('无权标记场地已清场');
    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此撤场复盘');

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
    if (!this.canComplete(user)) throw new Error('无权完成撤场复盘');
    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此撤场复盘');

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
    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权查看此撤场复盘');

    const selectFields = this.getSelectFieldsByRole(user.role);
    const teardown = await prisma.teardownReview.findUnique({
      where: { id },
      select: selectFields,
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

    const filteredAuditLogs = user.role === Role.SUPPLIER_CONTACT
      ? auditLogs.filter(log => ['SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE'].includes(log.action))
      : auditLogs;

    return {
      ...teardown,
      auditLogs: filteredAuditLogs,
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

    const accessibleIds = await this.getAccessibleTeardownIds(user);
    if (accessibleIds.length > 0) {
      where.id = { in: accessibleIds };
    }

    const selectFields = this.getSelectFieldsByRole(user.role);

    const [items, total] = await Promise.all([
      prisma.teardownReview.findMany({
        where,
        skip,
        take: pageSize,
        select: selectFields,
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
