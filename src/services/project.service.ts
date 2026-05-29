
import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult } from '../types';
import { AuditService } from './audit.service';

export class ProjectService {
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
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('项目不存在');
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
    return prisma.project.findUnique({
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
        auditLogs: {
          include: { operator: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
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

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          creator: { select: { id: true, name: true, role: true } },
        },
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

  static async addSupplier(user: AuthUser, projectId: string, supplierId: string, contractAmount?: number, scope?: string, ip?: string) {
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
    const [totalProjects, totalReconciliations, totalPayments, pendingApprovals] = await Promise.all([
      prisma.project.count(),
      prisma.reconciliation.count(),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
    ]);

    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: { select: { id: true, name: true, role: true } },
      },
    });

    return {
      totalProjects,
      totalReconciliations,
      totalPayments,
      pendingApprovals,
      recentActivities,
    };
  }
}
