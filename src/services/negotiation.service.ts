import { v4 as uuidv4 } from 'uuid';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { createAuditLog, trackChanges } from '../middleware/audit.middleware';
import { AUDIT_ACTION, NEGOTIATION_STATUS, NegotiationStatus, Role, ROLE, TODO_TYPE } from '../types';
import todoService from './todo.service';

export interface CreateNegotiationRequest {
  idempotencyKey: string;
  visitId: string;
  creatorId: string;
  customerName: string;
  customerComplaint: string;
  proposedReseedQty: number;
  proposedReseedDate?: Date;
}

export interface UpdateNegotiationStatusRequest {
  negotiationId: string;
  userId: string;
  newStatus: NegotiationStatus;
  changeReason?: string;
  rejectionReason?: string;
  reworkNote?: string;
  managerNote?: string;
  actualReseedQty?: number;
  actualReseedDate?: Date;
  confirmationNote?: string;
}

export class NegotiationService {
  private async recordStatusChange(
    negotiationId: string,
    fromStatus: NegotiationStatus | null,
    toStatus: NegotiationStatus,
    changedById: string,
    changeReason?: string
  ) {
    await prisma.negotiationStatusHistory.create({
      data: {
        negotiationId,
        fromStatus,
        toStatus,
        changedById,
        changeReason,
      },
    });
  }

  async createNegotiation(data: CreateNegotiationRequest) {
    const visit = await prisma.customerVisit.findUnique({
      where: { id: data.visitId },
      include: { sales: true },
    });

    if (!visit) {
      throw new Error('回访记录不存在');
    }

    const negotiation = await prisma.$transaction(async (tx) => {
      const neg = await tx.reseedNegotiation.create({
        data: {
          idempotencyKey: data.idempotencyKey || uuidv4(),
          visitId: data.visitId,
          creatorId: data.creatorId,
          customerName: data.customerName,
          customerComplaint: data.customerComplaint,
          proposedReseedQty: data.proposedReseedQty,
          proposedReseedDate: data.proposedReseedDate,
          status: NEGOTIATION_STATUS.DRAFT,
        },
        include: {
          creator: { select: { id: true, name: true, role: true } },
          visit: true,
        },
      });

      await this.recordStatusChange(
        neg.id,
        null,
        NEGOTIATION_STATUS.DRAFT,
        data.creatorId,
        '创建补苗协商'
      );

      return neg;
    });

    logger.info(`补苗协商已创建: ${negotiation.id}，客户: ${negotiation.customerName}`);
    return negotiation;
  }

  async submitNegotiation(negotiationId: string, userId: string) {
    const negotiation = await prisma.reseedNegotiation.findUnique({
      where: { id: negotiationId },
    });

    if (!negotiation) {
      throw new Error('协商记录不存在');
    }

    if (negotiation.status !== NEGOTIATION_STATUS.DRAFT && negotiation.status !== NEGOTIATION_STATUS.REWORK_REQUIRED) {
      throw new Error('只有草稿或待修改状态的协商才能提交');
    }

    if (negotiation.creatorId !== userId) {
      throw new Error('只能提交自己创建的协商');
    }

    const managers = await todoService.findAllUsersByRole(ROLE.BASE_MANAGER);
    if (managers.length === 0) {
      throw new Error('没有可用的基地负责人');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const neg = await tx.reseedNegotiation.update({
        where: { id: negotiationId },
        data: {
          status: NEGOTIATION_STATUS.MANAGER_REVIEW,
          currentHandlerId: managers[0].id,
        },
        include: {
          creator: { select: { id: true, name: true, role: true } },
          currentHandler: { select: { id: true, name: true, role: true } },
        },
      });

      await this.recordStatusChange(
        negotiationId,
        negotiation.status as NegotiationStatus,
        NEGOTIATION_STATUS.MANAGER_REVIEW,
        userId,
        '提交审核'
      );

      await tx.todoItem.create({
        data: {
          type: TODO_TYPE.NEGOTIATION_REVIEW,
          title: `补苗协商待审核: ${negotiation.customerName}`,
          description: `补苗数量: ${negotiation.proposedReseedQty}株，请审核`,
          referenceId: negotiationId,
          referenceType: 'ReseedNegotiation',
          assigneeId: managers[0].id,
          creatorId: userId,
          priority: 2,
        },
      });

      return neg;
    });

    await createAuditLog({
      userId,
      action: AUDIT_ACTION.SUBMIT,
      entityType: 'ReseedNegotiation',
      entityId: negotiationId,
      previousValue: { status: negotiation.status },
      newValue: { status: NEGOTIATION_STATUS.MANAGER_REVIEW },
      changeSummary: `提交补苗协商审核，客户: ${negotiation.customerName}`,
    });

    logger.info(`补苗协商已提交审核: ${negotiationId}`);
    return updated;
  }

  async updateStatus(data: UpdateNegotiationStatusRequest) {
    const { negotiationId, userId, newStatus, changeReason } = data;

    const [negotiation, user] = await Promise.all([
      prisma.reseedNegotiation.findUnique({
        where: { id: negotiationId },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, name: true },
      }),
    ]);

    if (!negotiation) {
      throw new Error('协商记录不存在');
    }

    if (!user) {
      throw new Error('用户不存在');
    }

    const userRole = user.role as Role;

    const canPerformAction = () => {
      switch (newStatus) {
        case NEGOTIATION_STATUS.APPROVED:
        case NEGOTIATION_STATUS.REJECTED:
        case NEGOTIATION_STATUS.REWORK_REQUIRED:
          return userRole === ROLE.BASE_MANAGER;
        case NEGOTIATION_STATUS.IMPLEMENTING:
        case NEGOTIATION_STATUS.COMPLETED:
          return (
            userRole === ROLE.MAINTENANCE_WORKER &&
            negotiation.currentHandlerId === userId
          );
        case NEGOTIATION_STATUS.CUSTOMER_CONFIRMED:
          return (
            userRole === ROLE.SALES_COORDINATOR &&
            negotiation.creatorId === userId
          );
        case NEGOTIATION_STATUS.MANAGER_REVIEW:
        case NEGOTIATION_STATUS.DRAFT:
        case NEGOTIATION_STATUS.SUBMITTED:
          return false;
        default:
          return false;
      }
    };

    if (!canPerformAction()) {
      logger.warn(
        `用户 ${user.name}(${userRole}) 尝试越权操作协商 ${negotiationId} 状态变更为 ${newStatus}`
      );
      throw new Error('权限不足，无法执行此操作');
    }

    const oldStatus = negotiation.status as NegotiationStatus;
    const { changed, summary } = trackChanges(
      { status: oldStatus },
      { status: newStatus }
    );

    if (!changed) {
      return negotiation;
    }

    const statusTransitions: Record<string, NegotiationStatus[]> = {
      [NEGOTIATION_STATUS.DRAFT]: [],
      [NEGOTIATION_STATUS.SUBMITTED]: [NEGOTIATION_STATUS.MANAGER_REVIEW],
      [NEGOTIATION_STATUS.MANAGER_REVIEW]: [
        NEGOTIATION_STATUS.APPROVED,
        NEGOTIATION_STATUS.REJECTED,
        NEGOTIATION_STATUS.REWORK_REQUIRED,
      ],
      [NEGOTIATION_STATUS.APPROVED]: [NEGOTIATION_STATUS.IMPLEMENTING],
      [NEGOTIATION_STATUS.REJECTED]: [NEGOTIATION_STATUS.REWORK_REQUIRED],
      [NEGOTIATION_STATUS.REWORK_REQUIRED]: [NEGOTIATION_STATUS.MANAGER_REVIEW],
      [NEGOTIATION_STATUS.IMPLEMENTING]: [
        NEGOTIATION_STATUS.COMPLETED,
        NEGOTIATION_STATUS.REWORK_REQUIRED,
      ],
      [NEGOTIATION_STATUS.COMPLETED]: [NEGOTIATION_STATUS.CUSTOMER_CONFIRMED],
      [NEGOTIATION_STATUS.CUSTOMER_CONFIRMED]: [],
    };

    if (!statusTransitions[oldStatus].includes(newStatus)) {
      throw new Error(`不允许从 ${oldStatus} 变更为 ${newStatus}`);
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (data.rejectionReason) updateData.rejectionReason = data.rejectionReason;
    if (data.reworkNote) updateData.reworkNote = data.reworkNote;
    if (data.managerNote) updateData.managerNote = data.managerNote;
    if (data.actualReseedQty) updateData.actualReseedQty = data.actualReseedQty;
    if (data.actualReseedDate) updateData.actualReseedDate = data.actualReseedDate;
    if (data.confirmationNote) {
      updateData.confirmationNote = data.confirmationNote;
      updateData.customerConfirmed = true;
    }

    if (newStatus === NEGOTIATION_STATUS.APPROVED) {
      const workers = await todoService.findAllUsersByRole(ROLE.MAINTENANCE_WORKER);
      if (workers.length > 0) {
        updateData.currentHandlerId = workers[0].id;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const neg = await tx.reseedNegotiation.update({
        where: { id: negotiationId },
        data: updateData,
        include: {
          creator: { select: { id: true, name: true, role: true } },
          currentHandler: { select: { id: true, name: true, role: true } },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { changedBy: { select: { id: true, name: true, role: true } } },
          },
        },
      });

      await this.recordStatusChange(
        negotiationId,
        oldStatus,
        newStatus,
        userId,
        changeReason || summary
      );

      if (newStatus === NEGOTIATION_STATUS.APPROVED) {
        const workers = await todoService.findAllUsersByRole(ROLE.MAINTENANCE_WORKER);
        if (workers.length > 0) {
          await tx.todoItem.create({
            data: {
              type: TODO_TYPE.RESEED_IMPLEMENTATION,
              title: `补苗执行: ${negotiation.customerName}`,
              description: `补苗数量: ${negotiation.proposedReseedQty}株，请安排执行`,
              referenceId: negotiationId,
              referenceType: 'ReseedNegotiation',
              assigneeId: workers[0].id,
              creatorId: userId,
              priority: 3,
            },
          });
        }
      }

      if (newStatus === NEGOTIATION_STATUS.REWORK_REQUIRED) {
        await tx.todoItem.create({
          data: {
            type: TODO_TYPE.NEGOTIATION_REVIEW,
            title: `补苗协商需修改: ${negotiation.customerName}`,
            description: `修改意见: ${data.reworkNote || '请重新核对信息'}`,
            referenceId: negotiationId,
            referenceType: 'ReseedNegotiation',
            assigneeId: negotiation.creatorId,
            creatorId: userId,
            priority: 2,
          },
        });
      }

      if (newStatus === NEGOTIATION_STATUS.COMPLETED) {
        await tx.todoItem.create({
          data: {
            type: TODO_TYPE.CUSTOMER_CONFIRMATION,
            title: `客户确认补苗结果: ${negotiation.customerName}`,
            description: '请联系客户确认补苗结果',
            referenceId: negotiationId,
            referenceType: 'ReseedNegotiation',
            assigneeId: negotiation.creatorId,
            creatorId: userId,
            priority: 1,
          },
        });
      }

      return neg;
    });

    await createAuditLog({
      userId,
      action: AUDIT_ACTION.STATUS_CHANGE,
      entityType: 'ReseedNegotiation',
      entityId: negotiationId,
      previousValue: { status: oldStatus },
      newValue: { status: newStatus },
      changeSummary: `${changeReason || summary}`,
    });

    logger.info(`协商状态变更: ${negotiationId} ${oldStatus} → ${newStatus}`);
    return updated;
  }

  async getNegotiationDetail(negotiationId: string, userId: string, role: Role) {
    const negotiation = await prisma.reseedNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        currentHandler: { select: { id: true, name: true, role: true } },
        visit: {
          include: {
            sales: { select: { id: true, name: true, role: true } },
            loading: {
              include: {
                harvest: {
                  include: {
                    plot: true,
                    batch: true,
                  },
                },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!negotiation) {
      return null;
    }

    if (role === ROLE.MAINTENANCE_WORKER && negotiation.currentHandlerId !== userId) {
      logger.warn(`养护员 ${userId} 尝试越权查看协商 ${negotiationId}`);
      throw new Error('权限不足，无法查看此协商记录');
    }
    if (role === ROLE.SALES_COORDINATOR && negotiation.creatorId !== userId) {
      logger.warn(`销售 ${userId} 尝试越权查看协商 ${negotiationId}`);
      throw new Error('权限不足，无法查看此协商记录');
    }

    const audits = await prisma.auditLog.findMany({
      where: {
        entityType: 'ReseedNegotiation',
        entityId: negotiationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return {
      ...negotiation,
      audits,
    };
  }

  async getNegotiationList(options?: {
    status?: NegotiationStatus;
    customerName?: string;
    handlerId?: string;
    creatorId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, customerName, handlerId, creatorId, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerName) where.customerName = { contains: customerName };
    if (handlerId) where.currentHandlerId = handlerId;
    if (creatorId) where.creatorId = creatorId;

    const [items, total] = await Promise.all([
      prisma.reseedNegotiation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, role: true } },
          currentHandler: { select: { id: true, name: true, role: true } },
          visit: { select: { id: true, visitDate: true, result: true } },
        },
      }),
      prisma.reseedNegotiation.count({ where }),
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

  async getRejectedNegotiations(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      status: NEGOTIATION_STATUS.REJECTED,
    };

    if (role === ROLE.SALES_COORDINATOR) {
      where.creatorId = userId;
    }

    return prisma.reseedNegotiation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        currentHandler: { select: { id: true, name: true, role: true } },
        visit: { select: { id: true, visitDate: true } },
      },
    });
  }

  async getNeedFollowUp(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      status: {
        in: [
          NEGOTIATION_STATUS.REWORK_REQUIRED,
          NEGOTIATION_STATUS.MANAGER_REVIEW,
          NEGOTIATION_STATUS.IMPLEMENTING,
        ],
      },
    };

    if (role === ROLE.SALES_COORDINATOR) {
      where.creatorId = userId;
    } else if (role === ROLE.MAINTENANCE_WORKER) {
      where.currentHandlerId = userId;
      where.status = NEGOTIATION_STATUS.IMPLEMENTING;
    } else if (role === ROLE.BASE_MANAGER) {
      where.status = NEGOTIATION_STATUS.MANAGER_REVIEW;
    }

    return prisma.reseedNegotiation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        currentHandler: { select: { id: true, name: true, role: true } },
        visit: { select: { id: true, visitDate: true } },
      },
    });
  }
}

export default new NegotiationService();
