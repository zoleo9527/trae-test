import prisma from '../utils/prisma.js';
import auditService from './auditService.js';

class MaterialService {
  async getMaterials({ category, lowStock, page = 1, pageSize = 50 }) {
    const where = {};
    
    if (category) where.category = category;
    if (lowStock) where.currentStock = { lte: prisma.material.fields.minStock };

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.material.count({ where }),
    ]);

    return { materials, total, page, pageSize };
  }

  async getMaterialDetail(id) {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        recipeItems: { include: { product: true } },
        stockLogs: { include: { operator: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        wasteRecords: { include: { production: true, recordedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!material) throw new Error('原料不存在');

    return material;
  }

  async updateStock(materialId, quantity, type, reason, operatorId, ipAddress, requestId) {
    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) throw new Error('原料不存在');

    const beforeStock = material.currentStock.toNumber();

    const updated = await prisma.material.update({
      where: { id: materialId },
      data: { currentStock: { increment: quantity } },
    });

    await prisma.stockLog.create({
      data: {
        materialId,
        quantity,
        type,
        reason,
        operatorId,
      },
    });

    await auditService.log({
      action: 'STOCK_UPDATE',
      entityType: 'Material',
      entityId: materialId,
      beforeValue: { currentStock: beforeStock },
      afterValue: { currentStock: updated.currentStock.toNumber() },
      operatorId,
      ipAddress,
      requestId,
    });

    return updated;
  }

  async createInventory(title, type, materialIds, operatorId) {
    const inventoryNo = `INV${Date.now()}`;
    
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
    });

    const inventoryItems = materials.map(m => ({
      materialId: m.id,
      systemStock: m.currentStock,
      actualStock: m.currentStock,
      difference: 0,
      unitPrice: m.unitPrice,
      differenceAmount: 0,
    }));

    const inventory = await prisma.inventory.create({
      data: {
        inventoryNo,
        title,
        type,
        status: 'DRAFT',
        createdById: operatorId,
        items: {
          create: inventoryItems,
        },
      },
      include: {
        items: { include: { material: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return inventory;
  }

  async startInventory(inventoryId, operatorId) {
    const inventory = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) throw new Error('盘点单不存在');
    if (inventory.status !== 'DRAFT') throw new Error('只有草稿状态的盘点单可以开始');

    return prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        items: { include: { material: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateInventoryItem(inventoryItemId, actualStock, remark, operatorId) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: { material: true },
    });

    if (!item) throw new Error('盘点项不存在');

    const systemStock = item.systemStock.toNumber();
    const difference = actualStock - systemStock;
    const differenceAmount = difference * item.unitPrice.toNumber();

    return prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        actualStock,
        difference,
        differenceAmount,
        remark,
      },
      include: { material: true },
    });
  }

  async completeInventory(inventoryId, operatorId) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { items: true },
    });

    if (!inventory) throw new Error('盘点单不存在');
    if (inventory.status !== 'IN_PROGRESS') throw new Error('只有进行中的盘点单可以完成');

    for (const item of inventory.items) {
      const difference = item.actualStock.toNumber() - item.systemStock.toNumber();
      if (difference !== 0) {
        await prisma.material.update({
          where: { id: item.materialId },
          data: { currentStock: item.actualStock },
        });

        await prisma.stockLog.create({
          data: {
            materialId: item.materialId,
            quantity: difference,
            type: 'INVENTORY_ADJUST',
            reason: `盘点调整 - ${inventory.inventoryNo}`,
            operatorId,
          },
        });
      }
    }

    return prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        items: { include: { material: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async getInventories({ status, page = 1, pageSize = 20 }) {
    const where = {};
    if (status) where.status = status;

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.inventory.count({ where }),
    ]);

    return { inventories, total, page, pageSize };
  }
}

export default new MaterialService();
