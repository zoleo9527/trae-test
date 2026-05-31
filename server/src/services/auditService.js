import prisma from '../utils/prisma.js';

class AuditService {
  async log({ action, entityType, entityId, beforeValue, afterValue, operatorId, ipAddress, userAgent, requestId }) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          beforeValue: beforeValue ? JSON.stringify(beforeValue) : null,
          afterValue: afterValue ? JSON.stringify(afterValue) : null,
          operatorId,
          ipAddress,
          userAgent,
          requestId,
        },
      });
    } catch (error) {
      console.error('审计日志写入失败:', error);
    }
  }

  async logOrderStatusChange({ orderId, beforeStatus, afterStatus, operatorId, ipAddress, requestId }) {
    await this.log({
      action: 'ORDER_STATUS_CHANGE',
      entityType: 'Order',
      entityId: orderId,
      beforeValue: { status: beforeStatus },
      afterValue: { status: afterStatus },
      operatorId,
      ipAddress,
      requestId,
    });
  }

  async logOrderUpdate({ orderId, beforeValue, afterValue, operatorId, ipAddress, requestId }) {
    await this.log({
      action: 'ORDER_UPDATE',
      entityType: 'Order',
      entityId: orderId,
      beforeValue,
      afterValue,
      operatorId,
      ipAddress,
      requestId,
    });
  }

  async logWasteRecord({ recordId, operatorId, ipAddress, requestId }) {
    await this.log({
      action: 'WASTE_RECORD_CREATE',
      entityType: 'WasteRecord',
      entityId: recordId,
      afterValue: { id: recordId },
      operatorId,
      ipAddress,
      requestId,
    });
  }

  async logRefund({ refundId, action, operatorId, ipAddress, requestId }) {
    await this.log({
      action,
      entityType: 'Refund',
      entityId: refundId,
      afterValue: { id: refundId },
      operatorId,
      ipAddress,
      requestId,
    });
  }

  async getLogs({ entityType, entityId, action, operatorId, startDate, endDate, page = 1, pageSize = 20 }) {
    const where = {};
    
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (operatorId) where.operatorId = operatorId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          operator: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        beforeValue: log.beforeValue ? JSON.parse(log.beforeValue) : null,
        afterValue: log.afterValue ? JSON.parse(log.afterValue) : null,
      })),
      total,
      page,
      pageSize,
    };
  }
}

export default new AuditService();
