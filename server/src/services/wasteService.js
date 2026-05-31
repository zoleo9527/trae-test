import prisma from '../utils/prisma.js';
import auditService from './auditService.js';

class WasteService {
  async createWasteRecord(data, operatorId, ipAddress, requestId) {
    const { productionId, materialId, orderId, quantity, reason, reasonDetail, remark } = data;

    if (!materialId && !productionId) {
      throw new Error('损耗记录必须关联原料或生产记录');
    }

    if (quantity <= 0) {
      throw new Error('损耗数量必须大于0');
    }

    let unitPrice = 0;
    let material = null;
    let production = null;

    if (materialId) {
      material = await prisma.material.findUnique({ where: { id: materialId } });
      if (!material) {
        throw new Error(`原料不存在: ${materialId}`);
      }
      unitPrice = material.unitPrice.toNumber();
    }

    if (productionId) {
      production = await prisma.production.findUnique({ where: { id: productionId } });
      if (!production) {
        throw new Error(`生产记录不存在: ${productionId}`);
      }
      if (!materialId && production.orderId) {
        const recipeItems = await prisma.recipeItem.findMany({
          where: {
            product: {
              orderItems: {
                some: {
                  orderId: production.orderId,
                },
              },
            },
          },
          take: 1,
          include: {
            material: true,
          },
        });
        if (recipeItems.length > 0) {
          material = recipeItems[0].material;
          unitPrice = material.unitPrice.toNumber();
        }
      }
    }

    const totalAmount = quantity * unitPrice;

    const finalReasonDetail = reasonDetail || (material ? `${material.name} 损耗` : (production ? `生产批次 ${production.batchNo} 损耗` : ''));
    const finalRemark = remark || '';

    const record = await prisma.wasteRecord.create({
      data: {
        productionId,
        materialId: material ? material.id : null,
        orderId,
        quantity,
        reason,
        reasonDetail: finalReasonDetail,
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

    if (material) {
      await prisma.material.update({
        where: { id: material.id },
        data: { currentStock: material.currentStock.minus(quantity) },
      });

      await prisma.stockLog.create({
        data: {
          materialId: material.id,
          quantity: -quantity,
          type: 'WASTE',
          reason: finalReasonDetail,
          operatorId,
        },
      });
    }

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
