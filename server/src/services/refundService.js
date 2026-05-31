import prisma from '../utils/prisma.js';
import auditService from './auditService.js';

class RefundService {
  generateRefundNo() {
    const date = new Date();
    const prefix = `REF${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  async createRefund(data, operatorId, ipAddress, requestId) {
    const { orderId, amount, reason, detail } = data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('订单不存在');

    const existingRefund = await prisma.refund.findUnique({ where: { orderId } });
    if (existingRefund) throw new Error('该订单已有退款申请');

    const refund = await prisma.refund.create({
      data: {
        orderId,
        refundNo: this.generateRefundNo(),
        amount,
        reason,
        detail,
        status: 'PENDING',
        createdById: operatorId,
      },
      include: {
        order: true,
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    await auditService.log({
      action: 'REFUND_CREATE',
      entityType: 'Refund',
      entityId: refund.id,
      beforeValue: null,
      afterValue: {
        refundNo: refund.refundNo,
        orderId,
        orderNo: order.orderNo,
        amount: parseFloat(refund.amount),
        reason,
        detail,
        status: 'PENDING',
      },
      operatorId,
      ipAddress,
      requestId,
    });

    return refund;
  }

  async getRefunds({ status, startDate, endDate, page = 1, pageSize = 20 }) {
    const where = {};
    
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: { select: { id: true, orderNo: true, customerName: true, totalAmount: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.refund.count({ where }),
    ]);

    return { refunds, total, page, pageSize };
  }

  async getRefundDetail(id) {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            notes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    if (!refund) throw new Error('退款记录不存在');

    const orderAuditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Order',
        entityId: refund.orderId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        operator: { select: { id: true, name: true, role: true } },
      },
    });

    const refundAuditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Refund',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        operator: { select: { id: true, name: true, role: true } },
      },
    });

    return {
      ...refund,
      order: {
        ...refund.order,
        auditLogs: orderAuditLogs.map(log => ({
          ...log,
          beforeValue: log.beforeValue ? JSON.parse(log.beforeValue) : null,
          afterValue: log.afterValue ? JSON.parse(log.afterValue) : null,
        })),
      },
      auditLogs: refundAuditLogs.map(log => ({
        ...log,
        beforeValue: log.beforeValue ? JSON.parse(log.beforeValue) : null,
        afterValue: log.afterValue ? JSON.parse(log.afterValue) : null,
      })),
    };
  }

  async approveRefund(id, operatorId, ipAddress, requestId) {
    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new Error('退款记录不存在');
    if (refund.status !== 'PENDING') throw new Error('只有待审核的退款可以审批');

    const beforeStatus = refund.status;

    const updated = await prisma.refund.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: operatorId,
        approvedAt: new Date(),
      },
    });

    const orderBefore = await prisma.order.findUnique({ where: { id: refund.orderId } });

    await prisma.order.update({
      where: { id: refund.orderId },
      data: { status: 'REFUNDED' },
    });

    await auditService.log({
      action: 'REFUND_APPROVE',
      entityType: 'Refund',
      entityId: id,
      beforeValue: {
        status: beforeStatus,
        refundNo: refund.refundNo,
        amount: parseFloat(refund.amount),
        reason: refund.reason,
      },
      afterValue: {
        status: 'APPROVED',
        refundNo: refund.refundNo,
        approvedById: operatorId,
        approvedAt: updated.approvedAt,
      },
      operatorId,
      ipAddress,
      requestId,
    });

    await auditService.log({
      action: 'ORDER_STATUS_CHANGE',
      entityType: 'Order',
      entityId: refund.orderId,
      beforeValue: { status: orderBefore.status },
      afterValue: { status: 'REFUNDED', reason: `退款审批通过 - ${refund.refundNo}` },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }

  async rejectRefund(id, rejectReason, operatorId, ipAddress, requestId) {
    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new Error('退款记录不存在');
    if (refund.status !== 'PENDING') throw new Error('只有待审核的退款可以驳回');

    const beforeStatus = refund.status;

    const updated = await prisma.refund.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: operatorId,
        approvedAt: new Date(),
        detail: refund.detail ? `${refund.detail} | 驳回原因: ${rejectReason || '未填写'}` : `驳回原因: ${rejectReason || '未填写'}`,
      },
    });

    await auditService.log({
      action: 'REFUND_REJECT',
      entityType: 'Refund',
      entityId: id,
      beforeValue: {
        status: beforeStatus,
        refundNo: refund.refundNo,
        amount: parseFloat(refund.amount),
        reason: refund.reason,
      },
      afterValue: {
        status: 'REJECTED',
        refundNo: refund.refundNo,
        rejectReason: rejectReason || '未填写',
        rejectedById: operatorId,
      },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }

  async completeRefund(id, operatorId, ipAddress, requestId) {
    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new Error('退款记录不存在');
    if (refund.status !== 'APPROVED') throw new Error('只有已批准的退款可以完成');

    const beforeStatus = refund.status;

    const updated = await prisma.refund.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    await auditService.log({
      action: 'REFUND_COMPLETE',
      entityType: 'Refund',
      entityId: id,
      beforeValue: {
        status: beforeStatus,
        refundNo: refund.refundNo,
        amount: parseFloat(refund.amount),
      },
      afterValue: {
        status: 'COMPLETED',
        refundNo: refund.refundNo,
        completedAt: new Date(),
      },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }
}

export default new RefundService();
