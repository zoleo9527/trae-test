import prisma from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

const chainService = {
  async getChainDetail(chainId) {
    const berthingPlan = await prisma.berthingPlan.findFirst({
      where: { chainId, isLatestVersion: true },
      include: {
        vessel: true,
        port: true,
        terminal: true,
        createdBy: { select: { name: true, role: true } },
      },
    });

    if (!berthingPlan) {
      throw new NotFoundError('业务链不存在');
    }

    const [documents, tasks, fees, supplyRequests, crewChanges, communications, auditLogs] = await Promise.all([
      prisma.document.findMany({
        where: { berthingPlanId: berthingPlan.id, isLatestVersion: true },
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.task.findMany({
        where: { berthingPlanId: berthingPlan.id },
        orderBy: { chainSequence: 'asc' },
        include: {
          assignedTo: { select: { name: true, role: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.fee.findMany({
        where: { berthingPlanId: berthingPlan.id },
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: true,
          createdBy: { select: { name: true } },
        },
      }),
      prisma.supplyRequest.findMany({
        where: { berthingPlanId: berthingPlan.id },
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: true,
          createdBy: { select: { name: true } },
        },
      }),
      prisma.crewChange.findMany({
        where: { berthingPlanId: berthingPlan.id },
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.communication.findMany({
        where: { berthingPlanId: berthingPlan.id },
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            { entityType: 'BerthingPlan', entityId: berthingPlan.id },
            { entityType: 'Task', entityId: { in: tasks.map(t => t.id) } },
            { entityType: 'Document', entityId: { in: documents.map(d => d.id) } },
            { entityType: 'Fee', entityId: { in: fees.map(f => f.id) } },
          ],
        },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
    const pendingDocuments = documents.filter(d => d.status !== 'APPROVED' && d.status !== 'EXPIRED').length;
    const unpaidFees = fees.filter(f => !f.isPaid).length;
    const unpaidAmount = fees
      .filter(f => !f.isPaid)
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    return {
      chainId,
      berthingPlan,
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        blockedTasks,
        taskProgress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        totalDocuments: documents.length,
        pendingDocuments,
        totalFees: fees.length,
        unpaidFees,
        unpaidAmount,
        totalSupplyRequests: supplyRequests.length,
        totalCrewChanges: crewChanges.length,
        totalCommunications: communications.length,
      },
      documents,
      tasks,
      fees,
      supplyRequests,
      crewChanges,
      communications,
      recentActivities: auditLogs,
    };
  },

  async getChainTimeline(chainId) {
    const berthingPlan = await prisma.berthingPlan.findFirst({
      where: { chainId, isLatestVersion: true },
    });

    if (!berthingPlan) {
      throw new NotFoundError('业务链不存在');
    }

    const [documents, tasks, fees, communications] = await Promise.all([
      prisma.document.findMany({
        where: { berthingPlanId: berthingPlan.id, isLatestVersion: true },
        select: { id: true, title: true, status: true, createdAt: true, deadline: true },
      }),
      prisma.task.findMany({
        where: { berthingPlanId: berthingPlan.id },
        select: { id: true, title: true, status: true, createdAt: true, deadline: true, completedDate: true },
      }),
      prisma.fee.findMany({
        where: { berthingPlanId: berthingPlan.id },
        select: { id: true, category: true, isPaid: true, createdAt: true, dueDate: true },
      }),
      prisma.communication.findMany({
        where: { berthingPlanId: berthingPlan.id },
        select: { id: true, subject: true, direction: true, createdAt: true },
      }),
    ]);

    const timeline = [
      ...tasks.map(t => ({
        type: 'TASK',
        id: t.id,
        title: t.title,
        status: t.status,
        date: t.completedDate || t.deadline || t.createdAt,
        createdAt: t.createdAt,
      })),
      ...documents.map(d => ({
        type: 'DOCUMENT',
        id: d.id,
        title: d.title,
        status: d.status,
        date: d.deadline || d.createdAt,
        createdAt: d.createdAt,
      })),
      ...fees.map(f => ({
        type: 'FEE',
        id: f.id,
        title: f.category,
        status: f.isPaid ? 'PAID' : 'UNPAID',
        date: f.dueDate || f.createdAt,
        createdAt: f.createdAt,
      })),
      ...communications.map(c => ({
        type: 'COMMUNICATION',
        id: c.id,
        title: c.subject,
        status: c.direction,
        date: c.createdAt,
        createdAt: c.createdAt,
      })),
    ];

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      chainId,
      berthingPlanId: berthingPlan.id,
      planNumber: berthingPlan.planNumber,
      timeline,
    };
  },

  async getChainByPlanId(berthingPlanId) {
    const plan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { chainId: true },
    });

    if (!plan) {
      throw new NotFoundError('靠泊计划不存在');
    }

    return this.getChainDetail(plan.chainId);
  },

  async getUserChains(userId, filters = {}) {
    const { status, startDate, endDate, search } = filters;

    const where = {
      isLatestVersion: true,
      createdById: userId,
    };

    if (status) where.status = status;
    if (startDate || endDate) {
      where.eta = {};
      if (startDate) where.eta.gte = new Date(startDate);
      if (endDate) where.eta.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { planNumber: { contains: search } },
        { vessel: { name: { contains: search } } },
      ];
    }

    const plans = await prisma.berthingPlan.findMany({
      where,
      include: {
        vessel: true,
        port: true,
        _count: {
          select: {
            documents: true,
            tasks: true,
            fees: true,
          },
        },
      },
      orderBy: { eta: 'desc' },
    });

    return plans.map(plan => ({
      chainId: plan.chainId,
      berthingPlan: plan,
      stats: {
        documents: plan._count.documents,
        tasks: plan._count.tasks,
        fees: plan._count.fees,
      },
    }));
  },

  async getChainStats(chainId) {
    const berthingPlan = await prisma.berthingPlan.findFirst({
      where: { chainId, isLatestVersion: true },
    });

    if (!berthingPlan) {
      throw new NotFoundError('业务链不存在');
    }

    const [taskStats, docStats, feeStats] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { berthingPlanId: berthingPlan.id },
        _count: true,
      }),
      prisma.document.groupBy({
        by: ['status'],
        where: { berthingPlanId: berthingPlan.id, isLatestVersion: true },
        _count: true,
      }),
      prisma.fee.aggregate({
        where: { berthingPlanId: berthingPlan.id },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const taskMap = {};
    taskStats.forEach(s => { taskMap[s.status] = s._count; });

    const docMap = {};
    docStats.forEach(s => { docMap[s.status] = s._count; });

    const unpaidFees = await prisma.fee.aggregate({
      where: { berthingPlanId: berthingPlan.id, isPaid: false },
      _sum: { amount: true },
    });

    return {
      chainId,
      planNumber: berthingPlan.planNumber,
      tasks: taskMap,
      documents: docMap,
      fees: {
        total: feeStats._count,
        totalAmount: feeStats._sum.amount?.toString() || '0',
        unpaidAmount: unpaidFees._sum.amount?.toString() || '0',
      },
    };
  },
};

export default chainService;
