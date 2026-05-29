import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult, Role, ProjectStatus, AuditAction } from '../types';
import { AuditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';

export class ProjectService {
  private static async getUserSupplierIds(user: AuthUser): Promise<string[]> {
    if (user.role !== Role.SUPPLIER_CONTACT) return [];

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { supplierId: true },
    });

    return fullUser?.supplierId ? [fullUser.supplierId] : [];
  }

  private static async getAccessibleProjectIds(user: AuthUser): Promise<string[]> {
    if (([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE, Role.FINANCE] as Role[]).includes(user.role)) {
      return [];
    }

    const supplierIds = await this.getUserSupplierIds(user);
    if (supplierIds.length === 0) return ['__no_access__'];

    const projectSuppliers = await prisma.projectSupplier.findMany({
      where: { supplierId: { in: supplierIds } },
      select: { projectId: true },
    });

    return projectSuppliers.map(ps => ps.projectId);
  }

  static canViewProject(user: AuthUser): boolean {
    return true;
  }

  static canEditProject(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR] as Role[]).includes(user.role);
  }

  static canManageSuppliers(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR] as Role[]).includes(user.role);
  }

  static async generateCode(): Promise<string> {
    const today = new Date();
    const prefix = `XM${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const latest = await prisma.project.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });

    if (!latest) {
      return `${prefix}001`;
    }

    const num = parseInt(latest.code.slice(-3)) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  }

  static async create(user: AuthUser, data: {
    name: string;
    description?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
  }, ip?: string) {
    if (!this.canEditProject(user)) {
      throw new AppError('无权创建项目', 403);
    }

    const code = await this.generateCode();

    const project = await prisma.project.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget ?? 0,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'Project', project.id, {
      remark: `创建项目: ${project.code} - ${project.name}`,
      ip,
    });

    return project;
  }

  static async update(user: AuthUser, id: string, data: {
    name?: string;
    description?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    status?: ProjectStatus;
    budget?: number;
  }, ip?: string) {
    if (!this.canEditProject(user)) {
      throw new AppError('无权编辑项目', 403);
    }

    const accessibleIds = await this.getAccessibleProjectIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) {
      throw new AppError('无权编辑此项目', 403);
    }

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('项目不存在', 404);
    }

    const oldData = {
      name: existing.name,
      description: existing.description,
      location: existing.location,
      status: existing.status,
      budget: existing.budget,
    };

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.logChanges(user, AuditAction.UPDATE, 'Project', id, oldData, data, ip);

    return project;
  }

  static async getById(user: AuthUser, id: string) {
    const accessibleIds = await this.getAccessibleProjectIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) {
      throw new AppError('无权访问此项目', 403);
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        suppliers: {
          include: {
            supplier: { select: { id: true, name: true, contact: true, phone: true } },
          },
        },
        materials: true,
        reconciliations: {
          select: { id: true, code: true, title: true, status: true, totalAmount: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          select: { id: true, code: true, title: true, status: true, amount: true },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          select: { id: true, title: true, type: true, status: true, deadline: true },
        },
      },
    });

    if (!project) return null;

    const [auditLogs, comments] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: 'Project', entityId: id },
        include: { operator: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.comment.findMany({
        where: { entityType: 'Project', entityId: id },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const filteredAuditLogs = this.filterAuditLogsByRole(user.role, auditLogs);
    const selectFields = this.getProjectSelectFieldsByRole(user.role);

    const filteredProject: any = {};
    for (const [key, value] of Object.entries(project)) {
      if (selectFields[key as keyof typeof selectFields] !== false) {
        filteredProject[key] = value;
      }
    }

    return {
      ...filteredProject,
      auditLogs: filteredAuditLogs,
      comments,
    };
  }

  static async getList(
    user: AuthUser,
    params: {
      status?: ProjectStatus;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResult<any>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.status) where.status = params.status;

    const accessibleIds = await this.getAccessibleProjectIds(user);
    if (accessibleIds.length > 0) where.id = { in: accessibleIds };

    const selectFields = this.getProjectSelectFieldsByRole(user.role);

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private static getProjectSelectFieldsByRole(role: Role) {
    const base = {
      id: true,
      code: true,
      name: true,
      description: true,
      location: true,
      startDate: true,
      endDate: true,
      status: true,
      createdAt: true,
      creator: { select: { id: true, name: true, role: true } },
    };

    switch (role) {
      case Role.SUPPLIER_CONTACT:
        return {
          ...base,
          budget: false,
        };
      case Role.SITE_EXECUTIVE:
      case Role.PROJECT_COORDINATOR:
      case Role.FINANCE:
      case Role.ADMIN:
      default:
        return {
          ...base,
          budget: true,
        };
    }
  }

  static filterAuditLogsByRole(role: Role, auditLogs: any[]) {
    if (role === Role.SUPPLIER_CONTACT) {
      return auditLogs.filter(log =>
        ['SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE', 'CREATE'].includes(log.action)
      );
    }
    return auditLogs;
  }

  static async addSupplier(user: AuthUser, projectId: string, supplierId: string, contractAmount?: number, scope?: string, ip?: string) {
    if (!this.canManageSuppliers(user)) {
      throw new AppError('无权管理项目供应商', 403);
    }

    const accessibleIds = await this.getAccessibleProjectIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(projectId)) {
      throw new AppError('无权管理此项目的供应商', 403);
    }

    const projectSupplier = await prisma.projectSupplier.create({
      data: {
        projectId,
        supplierId,
        contractAmount: contractAmount ?? 0,
        scope,
      },
      include: {
        supplier: true,
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'ProjectSupplier', projectSupplier.id, {
      remark: `项目添加供应商`,
      ip,
    });

    return projectSupplier;
  }

  static async getDashboardStats(user: AuthUser) {
    const accessibleProjectIds = await this.getAccessibleProjectIds(user);
    const projectIdFilter = accessibleProjectIds.length > 0
      ? { projectId: { in: accessibleProjectIds } }
      : {};

    const userSupplierIds = await this.getUserSupplierIds(user);
    const isSupplier = user.role === Role.SUPPLIER_CONTACT && userSupplierIds.length > 0;

    const reconciliationFilter = isSupplier
      ? { supplierId: { in: userSupplierIds } }
      : projectIdFilter;

    const reconciliationsForPayment = await prisma.reconciliation.findMany({
      where: reconciliationFilter,
      select: { id: true },
    });
    const reconciliationIdFilter = reconciliationsForPayment.length > 0
      ? { reconciliationId: { in: reconciliationsForPayment.map(r => r.id) } }
      : { reconciliationId: '__no_access__' };

    const [totalProjects, totalReconciliations, totalPayments, pendingApprovals] = await Promise.all([
      prisma.project.count({
        where: accessibleProjectIds.length > 0
          ? { id: { in: accessibleProjectIds } }
          : {}
      }),
      prisma.reconciliation.count({ where: reconciliationFilter }),
      prisma.payment.count({ where: reconciliationIdFilter }),
      prisma.payment.count({ where: { status: 'PENDING', ...reconciliationIdFilter } }),
    ]);

    const recentActivities = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: { select: { id: true, name: true, role: true } },
      },
    });

    if (accessibleProjectIds.length > 0) {
      const [paymentIds, documentIds, teardownIds] = await Promise.all([
        prisma.payment.findMany({ where: reconciliationIdFilter, select: { id: true } }),
        prisma.document.findMany({ where: projectIdFilter, select: { id: true } }),
        prisma.teardownReview.findMany({ where: projectIdFilter, select: { id: true } }),
      ]);

      const reconcIdSet = new Set(reconciliationsForPayment.map(r => r.id));
      const paymentIdSet = new Set(paymentIds.map(p => p.id));
      const docIdSet = new Set(documentIds.map(d => d.id));
      const teardownIdSet = new Set(teardownIds.map(t => t.id));

      const filteredActivities = recentActivities.filter(activity => {
        if (activity.entityType === 'Project' && accessibleProjectIds.includes(activity.entityId)) return true;
        if (activity.entityType === 'Reconciliation' && reconcIdSet.has(activity.entityId)) return true;
        if (activity.entityType === 'Payment' && paymentIdSet.has(activity.entityId)) return true;
        if (activity.entityType === 'Document' && docIdSet.has(activity.entityId)) return true;
        if (activity.entityType === 'TeardownReview' && teardownIdSet.has(activity.entityId)) return true;
        return false;
      }).filter(activity => {
        if (user.role === Role.SUPPLIER_CONTACT) {
          const allowedActions: AuditAction[] = [
            AuditAction.CREATE,
            AuditAction.SUBMIT,
            AuditAction.APPROVE,
            AuditAction.REJECT,
            AuditAction.COMPLETE,
            AuditAction.UPDATE,
          ];
          return allowedActions.includes(activity.action as AuditAction);
        }
        return true;
      }).map(activity => {
        if (user.role === Role.SUPPLIER_CONTACT) {
          const { oldValue, newValue, fieldName, ...safeActivity } = activity;
          return safeActivity;
        }
        return activity;
      });

      return {
        totalProjects,
        totalReconciliations,
        totalPayments,
        pendingApprovals,
        recentActivities: filteredActivities.slice(0, 10),
      };
    }

    const finalActivities = recentActivities.filter(activity => {
      if (user.role === Role.SUPPLIER_CONTACT) {
        const allowedActions: AuditAction[] = [
          AuditAction.CREATE,
          AuditAction.SUBMIT,
          AuditAction.APPROVE,
          AuditAction.REJECT,
          AuditAction.COMPLETE,
          AuditAction.UPDATE,
        ];
        return allowedActions.includes(activity.action as AuditAction);
      }
      return true;
    }).map(activity => {
      if (user.role === Role.SUPPLIER_CONTACT) {
        const { oldValue, newValue, fieldName, ...safeActivity } = activity;
        return safeActivity;
      }
      return activity;
    });

    return {
      totalProjects,
      totalReconciliations,
      totalPayments,
      pendingApprovals,
      recentActivities: finalActivities.slice(0, 10),
    };
  }
}
