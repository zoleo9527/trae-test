
import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult } from '../types';
import { AuditService } from './audit.service';

export interface CreateReconciliationDTO {
  projectId: string;
  supplierId: string;
  title: string;
  description?: string;
  items: {
    materialId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    remark?: string;
  }[];
}

export interface UpdateReconciliationDTO {
  title?: string;
  description?: string;
  items?: {
    id?: string;
    materialId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    remark?: string;
  }[];
}

export class ReconciliationService {
  static async generateCode(): Promise<string> {
    const today = new Date();
    const prefix = `DZ${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const latest = await prisma.reconciliation.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });

    if (!latest) {
      return `${prefix}001`;
    }

    const num = parseInt(latest.code.slice(-3)) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  }

  static async create(user: AuthUser, dto: CreateReconciliationDTO, ip?: string) {
    const code = await this.generateCode();
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    const reconciliation = await prisma.reconciliation.create({
      data: {
        code,
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        title: dto.title,
        description: dto.description,
        totalAmount,
        creatorId: user.id,
        items: {
          create: dto.items.map(item => ({
            materialId: item.materialId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            remark: item.remark,
          })),
        },
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'Reconciliation', reconciliation.id, {
      remark: `创建对账单: ${reconciliation.code}`,
      ip,
    });

    return reconciliation;
  }

  static async update(user: AuthUser, id: string, dto: UpdateReconciliationDTO, ip?: string) {
    const existing = await prisma.reconciliation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new Error('对账单不存在');
    }

    if (existing.status !== ReconciliationStatus.DRAFT && existing.status !== ReconciliationStatus.REVISED) {
      throw new Error('当前状态不允许修改');
    }

    const oldData = {
      title: existing.title,
      description: existing.description,
      status: existing.status,
    };

    const newData: any = {
      title: dto.title,
      description: dto.description,
    };

    if (dto.items) {
      newData.totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);
      await prisma.reconciliationItem.deleteMany({
        where: { reconciliationId: id },
      });
      newData.items = {
        create: dto.items.map(item => ({
          materialId: item.materialId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          remark: item.remark,
        })),
      };
    }

    const reconciliation = await prisma.reconciliation.update({
      where: { id },
      data: newData,
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    await AuditService.logChanges(user, AuditAction.UPDATE, 'Reconciliation', id, oldData, newData, ip);

    return reconciliation;
  }

  static async submit(user: AuthUser, id: string, ip?: string) {
    const existing = await prisma.reconciliation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('对账单不存在');
    }

    if (existing.status !== ReconciliationStatus.DRAFT && existing.status !== ReconciliationStatus.REVISED) {
      throw new Error('当前状态不允许提交');
    }

    const reconciliation = await prisma.reconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    await AuditService.log(user, AuditAction.SUBMIT, 'Reconciliation', id, {
      oldValue: existing.status,
      newValue: ReconciliationStatus.SUBMITTED,
      remark: '提交对账单',
      ip,
    });

    return reconciliation;
  }

  static async approve(user: AuthUser, id: string, confirmedAmount?: number, ip?: string) {
    const existing = await prisma.reconciliation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('对账单不存在');
    }

    if (existing.status !== ReconciliationStatus.SUBMITTED && existing.status !== ReconciliationStatus.REVIEWING) {
      throw new Error('当前状态不允许审批');
    }

    const reconciliation = await prisma.reconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.APPROVED,
        confirmedAmount: confirmedAmount ?? existing.totalAmount,
        approvedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
        auditLogs: {
          include: { operator: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    await AuditService.log(user, AuditAction.APPROVE, 'Reconciliation', id, {
      oldValue: existing.status,
      newValue: ReconciliationStatus.APPROVED,
      remark: `审批通过，确认金额: ${confirmedAmount ?? existing.totalAmount}`,
      ip,
    });

    return reconciliation;
  }

  static async reject(user: AuthUser, id: string, reason: string, ip?: string) {
    const existing = await prisma.reconciliation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('对账单不存在');
    }

    const reconciliation = await prisma.reconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.REJECTED,
        rejectReason: reason,
        rejectedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    await AuditService.log(user, AuditAction.REJECT, 'Reconciliation', id, {
      oldValue: existing.status,
      newValue: ReconciliationStatus.REJECTED,
      remark: `驳回，原因: ${reason}`,
      ip,
    });

    return reconciliation;
  }

  static async requestRevise(user: AuthUser, id: string, note: string, ip?: string) {
    const existing = await prisma.reconciliation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('对账单不存在');
    }

    if (existing.status !== ReconciliationStatus.SUBMITTED && existing.status !== ReconciliationStatus.REVIEWING) {
      throw new Error('当前状态不允许退回修改');
    }

    const reconciliation = await prisma.reconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.REVISED,
        reviseNote: note,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    await AuditService.log(user, AuditAction.REVISE, 'Reconciliation', id, {
      oldValue: existing.status,
      newValue: ReconciliationStatus.REVISED,
      remark: `退回修改，说明: ${note}`,
      ip,
    });

    return reconciliation;
  }

  static async getById(user: AuthUser, id: string) {
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true, status: true } },
        supplier: { select: { id: true, name: true, contact: true, phone: true } },
        creator: { select: { id: true, name: true, role: true } },
        items: true,
        payments: {
          select: { id: true, code: true, amount: true, status: true, payDate: true },
        },
        auditLogs: {
          include: { operator: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!reconciliation) {
      throw new Error('对账单不存在');
    }

    if (user.role === Role.SUPPLIER_CONTACT) {
      return {
        ...reconciliation,
        auditLogs: reconciliation.auditLogs.filter(log => 
          ['SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE'].includes(log.action)
        ),
      };
    }

    return reconciliation;
  }

  static async getList(
    user: AuthUser,
    params: {
      projectId?: string;
      supplierId?: string;
      status?: ReconciliationStatus;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResult<any>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.projectId) where.projectId = params.projectId;
    if (params.supplierId) where.supplierId = params.supplierId;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.reconciliation.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, code: true, name: true } },
          supplier: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reconciliation.count({ where }),
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
