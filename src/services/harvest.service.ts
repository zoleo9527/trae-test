import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { createAuditLog } from '../middleware/audit.middleware';
import todoService from './todo.service';
import { HarvestStatus, AuditAction, TodoType, Role, HARVEST_STATUS, AUDIT_ACTION, TODO_TYPE, ROLE } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateHarvestRequest {
  idempotencyKey: string;
  plotId: string;
  batchId?: string;
  creatorId: string;
  scheduledDate: Date;
  targetQuantity: number;
  notes?: string;
}

export interface CreateLoadingRequest {
  idempotencyKey: string;
  harvestId: string;
  loadingDate: Date;
  vehicleNo: string;
  driverName?: string;
  quantity: number;
  checkedBy?: string;
  customerName: string;
  orderNo?: string;
  discrepancyNote?: string;
}

export class HarvestService {
  async createHarvest(data: CreateHarvestRequest) {
    const plot = await prisma.plot.findUnique({
      where: { id: data.plotId, isActive: true },
    });

    if (!plot) {
      throw new Error('地块不存在或已停用');
    }

    if (data.batchId) {
      const batch = await prisma.seedlingBatch.findUnique({
        where: { id: data.batchId },
      });
      if (!batch) {
        throw new Error('苗木批次不存在');
      }
    }

    const workers = await todoService.findAllUsersByRole(ROLE.MAINTENANCE_WORKER);
    const assigneeId = workers.length > 0 ? workers[0].id : undefined;

    const harvest = await prisma.$transaction(async (tx) => {
      const h = await tx.harvestRecord.create({
        data: {
          idempotencyKey: data.idempotencyKey || uuidv4(),
          plotId: data.plotId,
          batchId: data.batchId,
          creatorId: data.creatorId,
          assigneeId,
          scheduledDate: data.scheduledDate,
          targetQuantity: data.targetQuantity,
          notes: data.notes,
          status: HARVEST_STATUS.PENDING,
        },
        include: {
          plot: true,
          batch: true,
          creator: { select: { id: true, name: true, role: true } },
          assignee: { select: { id: true, name: true, role: true } },
        },
      });

      if (assigneeId) {
        await tx.todoItem.create({
          data: {
            type: TODO_TYPE.HARVEST_APPROVAL,
            title: `起苗任务: ${plot.plotNo}`,
            description: `计划起苗 ${data.targetQuantity}株，请安排执行`,
            referenceId: h.id,
            referenceType: 'HarvestRecord',
            assigneeId,
            creatorId: data.creatorId,
            priority: 2,
          },
        });
      }

      return h;
    });

    await createAuditLog({
      userId: data.creatorId,
      action: AUDIT_ACTION.CREATE,
      entityType: 'HarvestRecord',
      entityId: harvest.id,
      newValue: harvest,
      changeSummary: `创建起苗记录，地块: ${plot.plotNo}，数量: ${data.targetQuantity}株`,
    });

    logger.info(`起苗记录已创建: ${harvest.id}`);
    return harvest;
  }

  async updateHarvestStatus(
    harvestId: string,
    userId: string,
    status: HarvestStatus,
    actualQuantity?: number,
    qualityGrade?: string,
    rejectionReason?: string
  ) {
    const harvest = await prisma.harvestRecord.findUnique({
      where: { id: harvestId },
    });

    if (!harvest) {
      throw new Error('起苗记录不存在');
    }

    const oldStatus = harvest.status;
    const updateData: Record<string, unknown> = { status };

    if (status === HARVEST_STATUS.COMPLETED) {
      if (!actualQuantity) {
        throw new Error('完成起苗时必须填写实际数量');
      }
      updateData.actualQuantity = actualQuantity;
      updateData.actualDate = new Date();
      if (qualityGrade) updateData.qualityGrade = qualityGrade;
    }

    if (status === HARVEST_STATUS.REJECTED && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updated = await prisma.harvestRecord.update({
      where: { id: harvestId },
      data: updateData,
      include: {
        plot: true,
        batch: true,
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await createAuditLog({
      userId,
      action: AUDIT_ACTION.STATUS_CHANGE,
      entityType: 'HarvestRecord',
      entityId: harvestId,
      previousValue: { status: oldStatus },
      newValue: { status, actualQuantity, qualityGrade },
      changeSummary: `起苗状态变更: ${oldStatus} → ${status}`,
    });

    logger.info(`起苗状态变更: ${harvestId} ${oldStatus} → ${status}`);
    return updated;
  }

  async createLoadingRecord(data: CreateLoadingRequest, creatorId: string) {
    const harvest = await prisma.harvestRecord.findUnique({
      where: { id: data.harvestId },
      include: { plot: true },
    });

    if (!harvest) {
      throw new Error('起苗记录不存在');
    }

    if (harvest.status !== HARVEST_STATUS.COMPLETED) {
      throw new Error('起苗未完成，无法装车');
    }

    const loading = await prisma.loadingRecord.create({
      data: {
        idempotencyKey: data.idempotencyKey || uuidv4(),
        harvestId: data.harvestId,
        loadingDate: data.loadingDate,
        vehicleNo: data.vehicleNo,
        driverName: data.driverName,
        quantity: data.quantity,
        checkedBy: data.checkedBy,
        customerName: data.customerName,
        orderNo: data.orderNo,
        discrepancyNote: data.discrepancyNote,
      },
      include: {
        harvest: {
          include: {
            plot: true,
            batch: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: creatorId,
      action: AUDIT_ACTION.CREATE,
      entityType: 'LoadingRecord',
      entityId: loading.id,
      newValue: loading,
      changeSummary: `创建装车记录，客户: ${data.customerName}，数量: ${data.quantity}株`,
    });

    logger.info(`装车记录已创建: ${loading.id}`);
    return loading;
  }

  async getHarvestList(options?: {
    status?: HarvestStatus;
    plotId?: string;
    creatorId?: string;
    assigneeId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, plotId, creatorId, assigneeId, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (plotId) where.plotId = plotId;
    if (creatorId) where.creatorId = creatorId;
    if (assigneeId) where.assigneeId = assigneeId;

    const [items, total] = await Promise.all([
      prisma.harvestRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { scheduledDate: 'desc' },
        include: {
          plot: { select: { id: true, plotNo: true, location: true } },
          batch: { select: { id: true, species: true } },
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          loadings: { take: 5 },
        },
      }),
      prisma.harvestRecord.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getLoadingList(options?: {
    harvestId?: string;
    customerName?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { harvestId, customerName, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (harvestId) where.harvestId = harvestId;
    if (customerName) where.customerName = { contains: customerName };

    const [items, total] = await Promise.all([
      prisma.loadingRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { loadingDate: 'desc' },
        include: {
          harvest: {
            include: {
              plot: { select: { id: true, plotNo: true } },
              batch: { select: { id: true, species: true } },
            },
          },
        },
      }),
      prisma.loadingRecord.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

export default new HarvestService();
