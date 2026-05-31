import prisma from '../utils/prisma.js';
import auditService from './auditService.js';

class ProductionService {
  generateBatchNo() {
    const date = new Date();
    const prefix = `BAT${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  async createProduction(orderId, scheduledDate, operatorId, ipAddress, requestId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('订单不存在');

    const production = await prisma.production.create({
      data: {
        orderId,
        scheduledDate: new Date(scheduledDate),
        batchNo: this.generateBatchNo(),
        status: 'PENDING',
      },
      include: {
        order: true,
        operator: { select: { id: true, name: true } },
        wasteRecords: true,
        notes: true,
      },
    });

    await auditService.log({
      action: 'PRODUCTION_CREATE',
      entityType: 'Production',
      entityId: production.id,
      afterValue: production,
      operatorId,
      ipAddress,
      requestId,
    });

    return production;
  }

  async getProductions({ status, startDate, endDate, page = 1, pageSize = 20 }) {
    const where = {};
    
    if (status) where.status = status;
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: { include: { items: { include: { product: true } } } },
          operator: { select: { id: true, name: true } },
          wasteRecords: { include: { material: true, recordedBy: { select: { id: true, name: true } } } },
          notes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.production.count({ where }),
    ]);

    return { productions, total, page, pageSize };
  }

  async getProductionDetail(id) {
    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        order: { include: { items: { include: { product: true } } } },
        operator: { select: { id: true, name: true } },
        wasteRecords: { include: { material: true, recordedBy: { select: { id: true, name: true } } } },
        notes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!production) throw new Error('生产记录不存在');

    return production;
  }

  async startProduction(id, operatorId, ipAddress, requestId) {
    const production = await prisma.production.findUnique({ where: { id } });
    if (!production) throw new Error('生产记录不存在');
    if (production.status !== 'PENDING' && production.status !== 'REWORK') {
      throw new Error('只有待生产或返工的生产可以开始');
    }

    const updated = await prisma.production.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startTime: new Date(),
        operatorId,
      },
    });

    await auditService.log({
      action: 'PRODUCTION_START',
      entityType: 'Production',
      entityId: id,
      beforeValue: { status: production.status },
      afterValue: { status: 'IN_PROGRESS' },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }

  async completeProduction(id, yieldQuantity, defectiveQuantity, remark, operatorId, ipAddress, requestId) {
    const production = await prisma.production.findUnique({ where: { id } });
    if (!production) throw new Error('生产记录不存在');
    if (production.status !== 'IN_PROGRESS') throw new Error('只有生产中的任务可以完成');

    const updated = await prisma.production.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        yieldQuantity,
        defectiveQuantity,
        remark,
      },
    });

    await auditService.log({
      action: 'PRODUCTION_COMPLETE',
      entityType: 'Production',
      entityId: id,
      beforeValue: { status: production.status },
      afterValue: { status: 'COMPLETED', yieldQuantity, defectiveQuantity },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }

  async reworkProduction(id, operatorId, ipAddress, requestId) {
    const production = await prisma.production.findUnique({ where: { id } });
    if (!production) throw new Error('生产记录不存在');
    if (production.status !== 'COMPLETED') throw new Error('只有已完成的生产可以返工');

    const updated = await prisma.production.update({
      where: { id },
      data: { status: 'REWORK' },
    });

    await auditService.log({
      action: 'PRODUCTION_REWORK',
      entityType: 'Production',
      entityId: id,
      beforeValue: { status: production.status },
      afterValue: { status: 'REWORK' },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }

  async addNote(productionId, content, type, operatorId) {
    const note = await prisma.note.create({
      data: {
        productionId,
        content,
        type,
        createdById: operatorId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return note;
  }

  async getProductionSchedule(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const productions = await prisma.production.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        order: { include: { items: { include: { product: true } } } },
        operator: { select: { id: true, name: true } },
        wasteRecords: true,
      },
    });

    const totalYield = productions.reduce((sum, p) => sum + p.yieldQuantity, 0);
    const totalDefective = productions.reduce((sum, p) => sum + p.defectiveQuantity, 0);

    return {
      date,
      productions,
      summary: {
        total: productions.length,
        pending: productions.filter(p => p.status === 'PENDING').length,
        inProgress: productions.filter(p => p.status === 'IN_PROGRESS').length,
        completed: productions.filter(p => p.status === 'COMPLETED').length,
        totalYield,
        totalDefective,
      },
    };
  }
}

export default new ProductionService();
