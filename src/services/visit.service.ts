import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { createAuditLog } from '../middleware/audit.middleware';
import todoService from './todo.service';
import { VisitResult, AuditAction, TodoType, Role, VISIT_RESULT, AUDIT_ACTION, TODO_TYPE, ROLE } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateVisitRequest {
  idempotencyKey: string;
  loadingId?: string;
  salesId: string;
  customerName: string;
  customerPhone: string;
  visitDate: Date;
  visitType: string;
  result: VisitResult;
  feedback: string;
  hasComplaint?: boolean;
  complaintDetail?: string;
  followUpDate?: Date;
}

export class VisitService {
  async createVisit(data: CreateVisitRequest) {
    if (data.loadingId) {
      const loading = await prisma.loadingRecord.findUnique({
        where: { id: data.loadingId },
      });
      if (!loading) {
        throw new Error('装车记录不存在');
      }
    }

    const visit = await prisma.$transaction(async (tx) => {
      const v = await tx.customerVisit.create({
        data: {
          idempotencyKey: data.idempotencyKey || uuidv4(),
          loadingId: data.loadingId,
          salesId: data.salesId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          visitDate: data.visitDate,
          visitType: data.visitType,
          result: data.result,
          feedback: data.feedback,
          hasComplaint: data.hasComplaint || false,
          complaintDetail: data.complaintDetail,
          followUpDate: data.followUpDate,
          isFollowedUp: false,
        },
        include: {
          sales: { select: { id: true, name: true, role: true } },
          loading: data.loadingId
            ? {
                include: {
                  harvest: {
                    include: {
                      plot: true,
                      batch: true,
                    },
                  },
                },
              }
            : undefined,
        },
      });

      if (
        (data.result === VISIT_RESULT.DISSATISFIED ||
          data.result === VISIT_RESULT.NEEDS_FOLLOWUP ||
          data.hasComplaint) &&
        data.followUpDate
      ) {
        await tx.todoItem.create({
          data: {
            type: TODO_TYPE.VISIT_FOLLOWUP,
            title: `客户回访跟进: ${data.customerName}`,
            description: `回访结果: ${data.result}，${data.complaintDetail || data.feedback}`,
            referenceId: v.id,
            referenceType: 'CustomerVisit',
            assigneeId: data.salesId,
            creatorId: data.salesId,
            priority: data.hasComplaint ? 3 : 2,
            dueDate: data.followUpDate,
          },
        });
      }

      return v;
    });

    await createAuditLog({
      userId: data.salesId,
      action: AUDIT_ACTION.CREATE,
      entityType: 'CustomerVisit',
      entityId: visit.id,
      newValue: visit,
      changeSummary: `创建客户回访，客户: ${data.customerName}，结果: ${data.result}`,
    });

    logger.info(`客户回访已创建: ${visit.id}`);
    return visit;
  }

  async markFollowedUp(visitId: string, salesId: string, followUpNote: string) {
    const visit = await prisma.customerVisit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new Error('回访记录不存在');
    }

    if (visit.salesId !== salesId) {
      throw new Error('只能处理自己负责的回访记录');
    }

    const updated = await prisma.customerVisit.update({
      where: { id: visitId },
      data: {
        isFollowedUp: true,
        followUpNote,
      },
      include: {
        sales: { select: { id: true, name: true } },
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
    });

    await createAuditLog({
      userId: salesId,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'CustomerVisit',
      entityId: visitId,
      previousValue: { isFollowedUp: false },
      newValue: { isFollowedUp: true, followUpNote },
      changeSummary: `回访跟进完成: ${followUpNote}`,
    });

    logger.info(`回访已标记跟进完成: ${visitId}`);
    return updated;
  }

  async getVisitList(options?: {
    salesId?: string;
    customerName?: string;
    result?: VisitResult;
    hasComplaint?: boolean;
    isFollowedUp?: boolean;
    loadingId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      salesId,
      customerName,
      result,
      hasComplaint,
      isFollowedUp,
      loadingId,
      page = 1,
      pageSize = 20,
    } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (salesId) where.salesId = salesId;
    if (customerName) where.customerName = { contains: customerName };
    if (result) where.result = result;
    if (hasComplaint !== undefined) where.hasComplaint = hasComplaint;
    if (isFollowedUp !== undefined) where.isFollowedUp = isFollowedUp;
    if (loadingId) where.loadingId = loadingId;

    const [items, total] = await Promise.all([
      prisma.customerVisit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { visitDate: 'desc' },
        include: {
          sales: { select: { id: true, name: true } },
          loading: {
            select: {
              id: true,
              loadingDate: true,
              vehicleNo: true,
              quantity: true,
              customerName: true,
              harvest: {
                include: {
                  plot: { select: { id: true, plotNo: true } },
                  batch: { select: { id: true, species: true } },
                },
              },
            },
          },
          negotiations: { take: 5 },
        },
      }),
      prisma.customerVisit.count({ where }),
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

  async getVisitDetail(visitId: string) {
    return prisma.customerVisit.findUnique({
      where: { id: visitId },
      include: {
        sales: { select: { id: true, name: true, role: true } },
        loading: {
          include: {
            harvest: {
              include: {
                plot: true,
                batch: true,
                creator: { select: { id: true, name: true } },
              },
            },
          },
        },
        negotiations: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, name: true, role: true } },
            statusHistory: {
              orderBy: { createdAt: 'desc' },
              include: { changedBy: { select: { id: true, name: true, role: true } } },
            },
          },
        },
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }

  async getNeedFollowUpVisits(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      isFollowedUp: false,
      OR: [
        { result: VISIT_RESULT.DISSATISFIED },
        { result: VISIT_RESULT.NEEDS_FOLLOWUP },
        { hasComplaint: true },
      ],
    };

    if (role === ROLE.SALES_COORDINATOR) {
      where.salesId = userId;
    }

    return prisma.customerVisit.findMany({
      where,
      orderBy: { followUpDate: 'asc' },
      take: 10,
      include: {
        sales: { select: { id: true, name: true } },
        loading: { select: { id: true, loadingDate: true } },
      },
    });
  }
}

export default new VisitService();
