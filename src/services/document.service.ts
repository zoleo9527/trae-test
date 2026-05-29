import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult, Role, DocumentType, DocumentStatus, AuditAction } from '../types';
import { AuditService } from './audit.service';

export class DocumentService {
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

  static canStart(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canSubmit(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE] as Role[]).includes(user.role);
  }

  static canApprove(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR] as Role[]).includes(user.role);
  }

  static canReject(user: AuthUser): boolean {
    return ([Role.ADMIN, Role.PROJECT_COORDINATOR] as Role[]).includes(user.role);
  }

  private static async getAccessibleDocumentIds(user: AuthUser): Promise<string[]> {
    if (([Role.ADMIN, Role.PROJECT_COORDINATOR, Role.SITE_EXECUTIVE, Role.FINANCE] as Role[]).includes(user.role)) {
      return [];
    }

    const supplierIds = await this.getUserSupplierIds(user);
    if (supplierIds.length === 0) return ['__no_access__'];

    const documents = await prisma.document.findMany({
      where: {
        project: {
          suppliers: {
            some: { supplierId: { in: supplierIds } },
          },
        },
      },
      select: { id: true },
    });

    return documents.map(d => d.id);
  }

  private static getSelectFieldsByRole(role: Role) {
    const base = {
      id: true,
      type: true,
      title: true,
      description: true,
      projectId: true,
      status: true,
      deadline: true,
      assigneeId: true,
      createdAt: true,
      approvedAt: true,
      project: { select: { id: true, code: true, name: true } },
      assignee: { select: { id: true, name: true, role: true } },
    };

    if (role === Role.SUPPLIER_CONTACT) {
      return {
        ...base,
        rejectReason: false,
      };
    }

    return {
      ...base,
      rejectReason: true,
    };
  }

  static async create(user: AuthUser, data: {
    projectId: string;
    type: DocumentType;
    title: string;
    description?: string;
    deadline?: Date;
    assigneeId?: string;
  }, ip?: string) {
    if (!this.canCreate(user)) throw new Error('无权创建证件任务');

    const document = await prisma.document.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        assigneeId: data.assigneeId,
        status: DocumentStatus.NOT_STARTED,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'Document', document.id, {
      remark: `创建证件任务: ${document.title} (${document.type})`,
      ip,
    });

    return document;
  }

  static async update(user: AuthUser, id: string, data: {
    title?: string;
    description?: string;
    deadline?: Date;
    assigneeId?: string;
  }, ip?: string) {
    if (!this.canCreate(user)) throw new Error('无权修改证件任务');
    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此证件任务');

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('证件任务不存在');
    }

    const oldData = {
      title: existing.title,
      description: existing.description,
      deadline: existing.deadline,
      assigneeId: existing.assigneeId,
    };

    const document = await prisma.document.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.logChanges(user, AuditAction.UPDATE, 'Document', id, oldData, data, ip);

    return document;
  }

  static async startProgress(user: AuthUser, id: string, ip?: string) {
    if (!this.canStart(user)) throw new Error('无权开始办理证件任务');
    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此证件任务');

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('证件任务不存在');
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.IN_PROGRESS },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.UPDATE, 'Document', id, {
      fieldName: 'status',
      oldValue: existing.status,
      newValue: DocumentStatus.IN_PROGRESS,
      remark: '开始办理',
      ip,
    });

    return document;
  }

  static async submit(user: AuthUser, id: string, ip?: string) {
    if (!this.canSubmit(user)) throw new Error('无权提交证件任务');
    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此证件任务');

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('证件任务不存在');
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.SUBMITTED },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.SUBMIT, 'Document', id, {
      oldValue: existing.status,
      newValue: DocumentStatus.SUBMITTED,
      remark: '提交审核',
      ip,
    });

    return document;
  }

  static async approve(user: AuthUser, id: string, ip?: string) {
    if (!this.canApprove(user)) throw new Error('无权审批证件任务');
    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此证件任务');

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('证件任务不存在');
    }

    if (existing.status !== DocumentStatus.SUBMITTED) {
      throw new Error('当前状态不允许审批');
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.APPROVED, approvedAt: new Date() },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.APPROVE, 'Document', id, {
      oldValue: existing.status,
      newValue: DocumentStatus.APPROVED,
      remark: '审批通过',
      ip,
    });

    return document;
  }

  static async reject(user: AuthUser, id: string, reason: string, ip?: string) {
    if (!this.canReject(user)) throw new Error('无权驳回证件任务');
    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权操作此证件任务');

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('证件任务不存在');
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.REJECTED, rejectedAt: new Date(), rejectReason: reason },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.REJECT, 'Document', id, {
      oldValue: existing.status,
      newValue: DocumentStatus.REJECTED,
      remark: `驳回，原因: ${reason}`,
      ip,
    });

    return document;
  }

  static async getById(user: AuthUser, id: string) {
    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0 && !accessibleIds.includes(id)) throw new Error('无权查看此证件任务');

    const selectFields = this.getSelectFieldsByRole(user.role);
    const document = await prisma.document.findUnique({
      where: { id },
      select: selectFields,
    });

    if (!document) {
      throw new Error('证件任务不存在');
    }

    const [auditLogs, comments] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: 'Document', entityId: id },
        include: { operator: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.findMany({
        where: { entityType: 'Document', entityId: id },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const filteredAuditLogs = user.role === Role.SUPPLIER_CONTACT
      ? auditLogs.filter(log => ['SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE'].includes(log.action))
      : auditLogs;

    return {
      ...document,
      auditLogs: filteredAuditLogs,
      comments,
    };
  }

  static async getList(
    user: AuthUser,
    params: {
      projectId?: string;
      type?: DocumentType;
      status?: DocumentStatus;
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
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.assigneeId) where.assigneeId = params.assigneeId;

    const accessibleIds = await this.getAccessibleDocumentIds(user);
    if (accessibleIds.length > 0) {
      where.id = { in: accessibleIds };
    }

    const selectFields = this.getSelectFieldsByRole(user.role);

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: pageSize,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.count({ where }),
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
