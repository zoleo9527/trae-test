import prisma from '../lib/prisma';
import { AuthUser, PaginatedResult, Role, PaymentStatus, ReconciliationStatus, AuditAction } from '../types';
import { AuditService } from './audit.service';

export interface CreatePaymentDTO {
  reconciliationId?: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  payMethod?: string;
}

export class PaymentService {
  static async generateCode(): Promise<string> {
    const today = new Date();
    const prefix = `FK${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const latest = await prisma.payment.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });

    if (!latest) {
      return `${prefix}001`;
    }

    const num = parseInt(latest.code.slice(-3)) + 1;
    return `${prefix}${String(num).padStart(3, '0')}`;
  }

  static async create(user: AuthUser, dto: CreatePaymentDTO, ip?: string) {
    if (dto.reconciliationId) {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id: dto.reconciliationId },
      });

      if (!reconciliation) {
        throw new Error('对账单不存在');
      }

      if (reconciliation.status !== ReconciliationStatus.APPROVED) {
        throw new Error('对账单未审批通过，无法创建付款申请');
      }
    }

    const code = await this.generateCode();

    const payment = await prisma.payment.create({
      data: {
        code,
        reconciliationId: dto.reconciliationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        payMethod: dto.payMethod,
        creatorId: user.id,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reconciliation: { select: { id: true, code: true, status: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'Payment', payment.id, {
      remark: `创建付款申请: ${payment.code}, 金额: ${dto.amount}`,
      ip,
    });

    return payment;
  }

  static async approve(user: AuthUser, id: string, ip?: string) {
    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('付款申请不存在');
    }

    if (existing.status !== PaymentStatus.PENDING) {
      throw new Error('当前状态不允许审批');
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.APPROVED,
        approvedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reconciliation: { select: { id: true, code: true, status: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.APPROVE, 'Payment', id, {
      oldValue: existing.status,
      newValue: PaymentStatus.APPROVED,
      remark: '审批通过付款申请',
      ip,
    });

    return payment;
  }

  static async markPaid(user: AuthUser, id: string, payDate?: Date, ip?: string) {
    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('付款申请不存在');
    }

    if (existing.status !== PaymentStatus.APPROVED) {
      throw new Error('付款申请未审批通过');
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        payDate: payDate ?? new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reconciliation: { select: { id: true, code: true, status: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.COMPLETE, 'Payment', id, {
      oldValue: existing.status,
      newValue: PaymentStatus.PAID,
      remark: '标记付款完成',
      ip,
    });

    if (existing.reconciliationId) {
      const allPayments = await prisma.payment.findMany({
        where: { reconciliationId: existing.reconciliationId },
      });

      const totalPaid = allPayments
        .filter(p => p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + p.amount, 0);

      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id: existing.reconciliationId },
      });

      if (reconciliation && totalPaid >= (reconciliation.confirmedAmount || reconciliation.totalAmount)) {
        await prisma.reconciliation.update({
          where: { id: existing.reconciliationId },
          data: { status: ReconciliationStatus.COMPLETED },
        });

        await AuditService.log(user, AuditAction.COMPLETE, 'Reconciliation', existing.reconciliationId, {
          remark: '付款完成，对账单自动结案',
          ip,
        });
      }
    }

    return payment;
  }

  static async reject(user: AuthUser, id: string, reason: string, ip?: string) {
    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('付款申请不存在');
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.REJECTED,
        rejectReason: reason,
        rejectedAt: new Date(),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        reconciliation: { select: { id: true, code: true, status: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await AuditService.log(user, AuditAction.REJECT, 'Payment', id, {
      oldValue: existing.status,
      newValue: PaymentStatus.REJECTED,
      remark: `驳回付款申请，原因: ${reason}`,
      ip,
    });

    return payment;
  }

  static async getById(user: AuthUser, id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true, status: true } },
        reconciliation: {
          select: {
            id: true, code: true, status: true, totalAmount: true,
            supplier: { select: { id: true, name: true, contact: true, phone: true } },
          }
        },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    if (!payment) {
      throw new Error('付款申请不存在');
    }

    const [auditLogs, comments] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType: 'Payment', entityId: id },
        include: { operator: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.findMany({
        where: { entityType: 'Payment', entityId: id },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const result = {
      ...payment,
      auditLogs,
      comments,
    };

    if (user.role === Role.SUPPLIER_CONTACT) {
      return {
        ...result,
        auditLogs: auditLogs.filter(log =>
          ['SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE'].includes(log.action)
        ),
      };
    }

    return result;
  }

  static async getList(
    user: AuthUser,
    params: {
      projectId?: string;
      reconciliationId?: string;
      status?: PaymentStatus;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResult<any>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.projectId) where.projectId = params.projectId;
    if (params.reconciliationId) where.reconciliationId = params.reconciliationId;
    if (params.status) where.status = params.status;

    const selectFields = this.getSelectFieldsByRole(user.role);

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private static getSelectFieldsByRole(role: Role) {
    const base = {
      id: true,
      code: true,
      title: true,
      status: true,
      amount: true,
      payMethod: true,
      payDate: true,
      createdAt: true,
      approvedAt: true,
      project: { select: { id: true, code: true, name: true } },
      reconciliation: { select: { id: true, code: true, status: true } },
      creator: { select: { id: true, name: true, role: true } },
    };

    switch (role) {
      case Role.SUPPLIER_CONTACT:
        return {
          ...base,
          rejectReason: false,
        };
      default:
        return {
          ...base,
          rejectReason: true,
        };
    }
  }
}
