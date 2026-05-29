import prisma from '../lib/prisma';
import {
  NegotiationStatus,
  HarvestStatus,
  DiseaseSeverity,
  Role,
  NEGOTIATION_STATUS,
  HARVEST_STATUS,
  DISEASE_SEVERITY,
  ROLE,
} from '../types';

export class DashboardService {
  async getDashboardData(userId: string, role: Role) {
    const [
      todoStats,
      pendingHarvests,
      pendingNegotiations,
      rejectedNegotiations,
      needFollowUpNegotiations,
      unresolvedDiseases,
      needFollowUpVisits,
      recentActivities,
      stats,
    ] = await Promise.all([
      this.getTodoStats(userId),
      this.getPendingHarvests(userId, role),
      this.getPendingNegotiations(userId, role),
      this.getRejectedNegotiations(userId, role),
      this.getNeedFollowUpNegotiations(userId, role),
      this.getUnresolvedDiseases(userId, role),
      this.getNeedFollowUpVisits(userId, role),
      this.getRecentActivities(),
      this.getOverallStats(),
    ]);

    return {
      summary: {
        todoStats,
        stats,
      },
      pending: {
        harvests: pendingHarvests,
        negotiations: pendingNegotiations,
      },
      rejected: {
        negotiations: rejectedNegotiations,
      },
      needFollowUp: {
        negotiations: needFollowUpNegotiations,
        diseases: unresolvedDiseases,
        visits: needFollowUpVisits,
      },
      recentActivities,
    };
  }

  private async getTodoStats(userId: string) {
    const [pending, completed, highPriority] = await Promise.all([
      prisma.todoItem.count({
        where: { assigneeId: userId, isCompleted: false },
      }),
      prisma.todoItem.count({
        where: { assigneeId: userId, isCompleted: true },
      }),
      prisma.todoItem.count({
        where: { assigneeId: userId, isCompleted: false, priority: { gte: 2 } },
      }),
    ]);

    return { pending, completed, highPriority, total: pending + completed };
  }

  private async getPendingHarvests(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      status: { in: [HARVEST_STATUS.PENDING, HARVEST_STATUS.IN_PROGRESS] },
    };

    if (role === ROLE.MAINTENANCE_WORKER) {
      where.assigneeId = userId;
    }

    return prisma.harvestRecord.findMany({
      where,
      take: 5,
      orderBy: { scheduledDate: 'asc' },
      include: {
        plot: { select: { id: true, plotNo: true, location: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  private async getPendingNegotiations(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      status: {
        in: [
          NEGOTIATION_STATUS.MANAGER_REVIEW,
          NEGOTIATION_STATUS.IMPLEMENTING,
          NEGOTIATION_STATUS.REWORK_REQUIRED,
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
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        currentHandler: { select: { id: true, name: true, role: true } },
        visit: { select: { id: true, visitDate: true } },
      },
    });
  }

  private async getRejectedNegotiations(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      status: NEGOTIATION_STATUS.REJECTED,
    };

    if (role === ROLE.SALES_COORDINATOR) {
      where.creatorId = userId;
    }

    return prisma.reseedNegotiation.findMany({
      where,
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        visit: { select: { id: true, visitDate: true } },
      },
    });
  }

  private async getNeedFollowUpNegotiations(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      status: NEGOTIATION_STATUS.REWORK_REQUIRED,
    };

    if (role === ROLE.SALES_COORDINATOR) {
      where.creatorId = userId;
    }

    return prisma.reseedNegotiation.findMany({
      where,
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        visit: { select: { id: true, visitDate: true } },
      },
    });
  }

  private async getUnresolvedDiseases(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      isResolved: false,
    };

    if (role === ROLE.MAINTENANCE_WORKER) {
      where.reporterId = userId;
    }

    return prisma.diseaseReport.findMany({
      where,
      take: 5,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        plot: { select: { id: true, plotNo: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
  }

  private async getNeedFollowUpVisits(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      isFollowedUp: false,
      OR: [
        { result: 'DISSATISFIED' },
        { result: 'NEEDS_FOLLOWUP' },
        { hasComplaint: true },
      ],
    };

    if (role === ROLE.SALES_COORDINATOR) {
      where.salesId = userId;
    }

    return prisma.customerVisit.findMany({
      where,
      take: 5,
      orderBy: { followUpDate: 'asc' },
      include: {
        sales: { select: { id: true, name: true } },
      },
    });
  }

  private async getRecentActivities() {
    return prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  private async getOverallStats() {
    const [
      totalPlots,
      totalBatches,
      totalHarvests,
      totalLoadings,
      totalNegotiations,
      approvedNegotiations,
      pendingNegotiations,
      rejectedNegotiations,
      criticalDiseases,
      unresolvedDiseases,
    ] = await Promise.all([
      prisma.plot.count({ where: { isActive: true } }),
      prisma.seedlingBatch.count(),
      prisma.harvestRecord.count(),
      prisma.loadingRecord.count(),
      prisma.reseedNegotiation.count(),
      prisma.reseedNegotiation.count({
        where: {
          status: {
            in: [
              NEGOTIATION_STATUS.APPROVED,
              NEGOTIATION_STATUS.IMPLEMENTING,
              NEGOTIATION_STATUS.COMPLETED,
              NEGOTIATION_STATUS.CUSTOMER_CONFIRMED,
            ],
          },
        },
      }),
      prisma.reseedNegotiation.count({
        where: {
          status: {
            in: [
              NEGOTIATION_STATUS.MANAGER_REVIEW,
              NEGOTIATION_STATUS.REWORK_REQUIRED,
              NEGOTIATION_STATUS.IMPLEMENTING,
            ],
          },
        },
      }),
      prisma.reseedNegotiation.count({
        where: { status: NEGOTIATION_STATUS.REJECTED },
      }),
      prisma.diseaseReport.count({
        where: { severity: { in: [DISEASE_SEVERITY.CRITICAL, DISEASE_SEVERITY.SEVERE] } },
      }),
      prisma.diseaseReport.count({ where: { isResolved: false } }),
    ]);

    return {
      totalPlots,
      totalBatches,
      totalHarvests,
      totalLoadings,
      negotiations: {
        total: totalNegotiations,
        approved: approvedNegotiations,
        pending: pendingNegotiations,
        rejected: rejectedNegotiations,
      },
      diseases: {
        critical: criticalDiseases,
        unresolved: unresolvedDiseases,
      },
    };
  }

  async getAuditLogs(options?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { entityType, entityId, userId, action, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
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

export default new DashboardService();
