import { Request, Response, NextFunction } from 'express';
import { createObjectCsvStringifier } from 'csv-writer';
import prisma from '../../config/prisma';
import { parsePagination } from '../../utils/pagination';
import { success, successWithPagination } from '../../utils/response';
import { NotFoundError } from '../../middleware/errorHandler';

export async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, format, status, startDate, endDate } = req.query as any;

    const where: any = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (status) where.status = status;

    let data: any[] = [];
    let filename = '';
    let csvHeaders: any[] = [];

    switch (type) {
      case 'repair-orders':
        data = await prisma.repairOrder.findMany({
          where,
          include: { customer: true, watch: true },
          orderBy: { createdAt: 'desc' },
        });
        filename = `repair-orders-${Date.now()}`;
        csvHeaders = [
          { id: 'orderNo', title: '寄修单号' },
          { id: 'customerName', title: '客户姓名' },
          { id: 'customerPhone', title: '客户电话' },
          { id: 'watchBrand', title: '手表品牌' },
          { id: 'watchModel', title: '手表型号' },
          { id: 'status', title: '状态' },
          { id: 'estimatedCost', title: '预估费用' },
          { id: 'actualCost', title: '实际费用' },
          { id: 'createdAt', title: '创建时间' },
        ];
        data = data.map((item) => ({
          orderNo: item.orderNo,
          customerName: item.customer.name,
          customerPhone: item.customer.phone,
          watchBrand: item.watch.brand,
          watchModel: item.watch.model,
          status: item.status,
          estimatedCost: item.estimatedCost?.toString() || '',
          actualCost: item.actualCost?.toString() || '',
          createdAt: item.createdAt.toISOString(),
        }));
        break;

      case 'part-applications':
        data = await prisma.partApplication.findMany({
          where,
          include: { repairOrder: true, items: { include: { part: true } } },
          orderBy: { createdAt: 'desc' },
        });
        filename = `part-applications-${Date.now()}`;
        csvHeaders = [
          { id: 'applicationNo', title: '申请单号' },
          { id: 'repairOrderNo', title: '寄修单号' },
          { id: 'title', title: '标题' },
          { id: 'status', title: '状态' },
          { id: 'urgencyLevel', title: '紧急程度' },
          { id: 'partsSummary', title: '配件明细' },
          { id: 'createdAt', title: '创建时间' },
        ];
        data = data.map((item) => ({
          applicationNo: item.applicationNo,
          repairOrderNo: item.repairOrder?.orderNo || '',
          title: item.title,
          status: item.status,
          urgencyLevel: item.urgencyLevel,
          partsSummary: item.items
            .map((i) => `${i.part.name} x${i.requestedQty}`)
            .join('; '),
          createdAt: item.createdAt.toISOString(),
        }));
        break;

      case 'inventory':
        data = await prisma.inventory.findMany({
          include: { part: true },
          orderBy: { quantity: 'asc' },
        });
        filename = `inventory-${Date.now()}`;
        csvHeaders = [
          { id: 'sku', title: 'SKU' },
          { id: 'partName', title: '配件名称' },
          { id: 'category', title: '分类' },
          { id: 'warehouse', title: '仓库' },
          { id: 'quantity', title: '库存数量' },
          { id: 'reservedQty', title: '锁定数量' },
          { id: 'availableQty', title: '可用数量' },
          { id: 'unitPrice', title: '单价' },
        ];
        data = data.map((item) => ({
          sku: item.part.sku,
          partName: item.part.name,
          category: item.part.category,
          warehouse: item.warehouse,
          quantity: item.quantity,
          reservedQty: item.reservedQty,
          availableQty: item.quantity - item.reservedQty,
          unitPrice: item.part.unitPrice.toString(),
        }));
        break;

      case 'operation-logs':
        data = await prisma.operationLog.findMany({
          where,
          include: { user: { select: { realName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });
        filename = `operation-logs-${Date.now()}`;
        csvHeaders = [
          { id: 'traceId', title: 'Trace ID' },
          { id: 'userName', title: '操作人' },
          { id: 'module', title: '模块' },
          { id: 'operation', title: '操作' },
          { id: 'resourceType', title: '资源类型' },
          { id: 'resourceId', title: '资源ID' },
          { id: 'isSuccess', title: '是否成功' },
          { id: 'errorMessage', title: '错误信息' },
          { id: 'durationMs', title: '耗时(ms)' },
          { id: 'createdAt', title: '时间' },
        ];
        data = data.map((item) => ({
          traceId: item.traceId,
          userName: item.user?.realName || '未知',
          module: item.module,
          operation: item.operation,
          resourceType: item.resourceType || '',
          resourceId: item.resourceId || '',
          isSuccess: item.isSuccess ? '是' : '否',
          errorMessage: item.errorMessage || '',
          durationMs: item.durationMs || '',
          createdAt: item.createdAt.toISOString(),
        }));
        break;
    }

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: csvHeaders,
      });

      const csvContent =
        csvStringifier.getHeaderString() +
        csvStringifier.stringifyRecords(data);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.csv"`
      );

      const bom = '\uFEFF';
      return res.send(bom + csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.json"`
      );
      return res.json(data);
    }
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalRepairOrders,
      pendingQuotation,
      pendingParts,
      inRepair,
      totalApplications,
      pendingApproval,
      lowStockCount,
      activeLocks,
    ] = await Promise.all([
      prisma.repairOrder.count(),
      prisma.repairOrder.count({ where: { status: 'PENDING_QUOTATION' } }),
      prisma.repairOrder.count({ where: { status: 'AWAITING_PARTS' } }),
      prisma.repairOrder.count({ where: { status: 'IN_REPAIR' } }),
      prisma.partApplication.count(),
      prisma.partApplication.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.inventory.count({
        where: {
          quantity: { gt: 0 },
        },
      }).then(async (count) => {
        if (count === 0) return 0;
        const inventories = await prisma.inventory.findMany({
          where: { quantity: { gt: 0 } },
          select: { quantity: true, reservedQty: true, minStock: true },
        });
        return inventories.filter(
          (inv) => inv.quantity - inv.reservedQty <= inv.minStock
        ).length;
      }),
      prisma.inventoryLock.count({ where: { status: 'ACTIVE' } }),
    ]);

    const recentOrders = await prisma.repairOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        watch: { select: { brand: true, model: true } },
      },
    });

    const recentApplications = await prisma.partApplication.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { realName: true } },
        items: { include: { part: true }, take: 2 },
      },
    });

    return res.json(
      success(_req, {
        repairOrders: {
          total: totalRepairOrders,
          pendingQuotation,
          pendingParts,
          inRepair,
        },
        partApplications: {
          total: totalApplications,
          pendingApproval,
        },
        inventory: {
          lowStockCount,
          activeLocks,
        },
        recentOrders,
        recentApplications,
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getOperationLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const {
      traceId,
      module,
      operation,
      resourceType,
      resourceId,
      userId,
      isSuccess,
      startDate,
      endDate,
    } = req.query as any;

    const where: any = {};

    if (traceId) where.traceId = traceId;
    if (module) where.module = module;
    if (operation) where.operation = { contains: operation };
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (userId) where.userId = userId;
    if (isSuccess !== undefined) where.isSuccess = isSuccess;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, realName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operationLog.count({ where }),
    ]);

    return res.json(
      successWithPagination(req, logs, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function traceOperation(req: Request, res: Response, next: NextFunction) {
  try {
    const { traceId } = req.params;

    const logs = await prisma.operationLog.findMany({
      where: { traceId },
      include: {
        user: { select: { id: true, realName: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (logs.length === 0) {
      throw new NotFoundError('未找到该Trace ID的操作记录');
    }

    const groupedByResource: Record<string, any[]> = {};
    for (const log of logs) {
      const key = log.resourceType || 'system';
      if (!groupedByResource[key]) {
        groupedByResource[key] = [];
      }
      groupedByResource[key].push(log);
    }

    return res.json(
      success(req, {
        traceId,
        totalOperations: logs.length,
        startTime: logs[0]?.createdAt,
        endTime: logs[logs.length - 1]?.createdAt,
        durationMs:
          logs[0] && logs[logs.length - 1]
            ? new Date(logs[logs.length - 1].createdAt).getTime() -
              new Date(logs[0].createdAt).getTime()
            : 0,
        operations: logs,
        groupedByResource,
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getErrorLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where: { isSuccess: false },
        skip,
        take,
        include: {
          user: { select: { id: true, realName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operationLog.count({ where: { isSuccess: false } }),
    ]);

    return res.json(
      successWithPagination(req, logs, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}
