import prisma from '../utils/prisma.js';
import auditService from './auditService.js';

class WasteService {
  async createWasteRecord(data, operatorId, ipAddress, requestId) {
    const { productionId, materialId, orderId, quantity, reason, reasonDetail } = data;

    let unitPrice = 0;
    if (materialId) {
      const material = await prisma.material.findUnique({ where: { id: materialId } });
      if (material) {
        unitPrice = material.unitPrice.toNumber();
      }
    }

    const totalAmount = quantity * unitPrice;

    const record = await prisma.wasteRecord.create({
      data: {
        productionId,
        materialId,
        orderId,
        quantity,
        reason,
        reasonDetail,
        unitPrice,
        totalAmount,
        recordedById: operatorId,
      },
      include: {
        material: true,
        production: true,
        order: true,
        recordedBy: { select: { id: true, name: true } },
      },
    });

    await auditService.logWasteRecord({
      recordId: record.id,
      operatorId,
      ipAddress,
      requestId,
    });

    return record;
  }

  async getWasteRecords({ reason, startDate, endDate, materialId, productionId, orderId, page = 1, pageSize = 20 }) {
    const where = {};
    
    if (reason) where.reason = reason;
    if (materialId) where.materialId = materialId;
    if (productionId) where.productionId = productionId;
    if (orderId) where.orderId = orderId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.wasteRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          material: true,
          production: true,
          order: { select: { id: true, orderNo: true, customerName: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.wasteRecord.count({ where }),
    ]);

    return { records, total, page, pageSize };
  }

  async getWasteAnalysis({ startDate, endDate, groupBy = 'reason' }) {
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const records = await prisma.wasteRecord.findMany({
      where,
      include: {
        material: true,
        production: true,
      },
    });

    const totalWaste = records.reduce((sum, r) => sum + r.totalAmount.toNumber(), 0);
    const totalRecords = records.length;

    let groupedData = {};
    
    if (groupBy === 'reason') {
      groupedData = records.reduce((acc, r) => {
        if (!acc[r.reason]) {
          acc[r.reason] = { count: 0, amount: 0 };
        }
        acc[r.reason].count++;
        acc[r.reason].amount += r.totalAmount.toNumber();
        return acc;
      }, {});
    } else if (groupBy === 'material') {
      groupedData = records.reduce((acc, r) => {
        const key = r.material?.name || '未知原料';
        if (!acc[key]) {
          acc[key] = { count: 0, amount: 0 };
        }
        acc[key].count++;
        acc[key].amount += r.totalAmount.toNumber();
        return acc;
      }, {});
    }

    return {
      summary: {
        totalRecords,
        totalWaste,
        averagePerRecord: totalRecords > 0 ? totalWaste / totalRecords : 0,
      },
      groupedData,
      records,
    };
  }
}

export default new WasteService();
