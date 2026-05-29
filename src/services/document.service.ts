import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult, DocumentType, DocumentStatus, AuditAction } from '../types';
import { AuditService } from './audit.service';

export class DocumentService {
  static async create(user: AuthUser, data: {
    projectId: string;
    type: DocumentType;
    title: string;
    description?: string;
    deadline?: Date;
    assigneeId?: string;
  }, ip?: string) {
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
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
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

    return {
      ...document,
      auditLogs,
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

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, code: true, name: true } },
          assignee: { select: { id: true, name: true, role: true } },
        },
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
