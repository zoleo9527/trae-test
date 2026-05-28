import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const getPlanNumber = () => {
  const date = new Date();
  const prefix = `BP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

const berthingService = {
  async createPlan(data, userId, ipAddress) {
    const { vesselId, portId, terminalId, eta, etd, purpose, cargoType, cargoQuantity, crewCount, remarks, priority } = data;

    if (new Date(eta) < new Date()) {
      throw new ValidationError('预计到港时间不能早于当前时间');
    }

    if (etd && new Date(etd) <= new Date(eta)) {
      throw new ValidationError('预计离港时间必须晚于到港时间');
    }

    const chainId = uuidv4();
    const planNumber = getPlanNumber();

    const plan = await prisma.berthingPlan.create({
      data: {
        planNumber,
        vesselId,
        portId,
        terminalId,
        eta: new Date(eta),
        etd: etd ? new Date(etd) : null,
        purpose,
        cargoType,
        cargoQuantity,
        crewCount,
        remarks,
        priority,
        chainId,
        chainVersion: 1,
        isLatestVersion: true,
        createdById: userId,
      },
      include: {
        vessel: true,
        port: true,
        terminal: true,
        createdBy: { select: { name: true, role: true } },
      },
    });

    await auditService.log('CREATE', 'BerthingPlan', plan.id, userId, {
      newValues: plan,
      ipAddress,
      remarks: '创建靠泊计划',
    });

    return plan;
  },

  async getPlan(id) {
    const plan = await prisma.berthingPlan.findUnique({
      where: { id },
      include: {
        vessel: true,
        port: true,
        terminal: true,
        documents: { where: { isLatestVersion: true } },
        tasks: true,
        fees: { include: { supplier: true } },
        supplyRequests: { include: { supplier: true } },
        crewChanges: true,
        communications: { orderBy: { createdAt: 'desc' } },
        createdBy: { select: { name: true, role: true } },
        comments: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('靠泊计划不存在');
    }

    return plan;
  },

  async getPlanByChain(chainId) {
    return prisma.berthingPlan.findMany({
      where: { chainId },
      orderBy: { chainVersion: 'desc' },
      include: {
        createdBy: { select: { name: true } },
      },
    });
  },

  async getPlans(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'eta', sortOrder = 'asc' } = options;
    const { status, vesselId, portId, startDate, endDate, search, createdById, priority } = filters;

    const where = { isLatestVersion: true };

    if (status) where.status = status;
    if (vesselId) where.vesselId = vesselId;
    if (portId) where.portId = portId;
    if (priority) where.priority = priority;
    if (createdById) where.createdById = createdById;
    if (startDate || endDate) {
      where.eta = {};
      if (startDate) where.eta.gte = new Date(startDate);
      if (endDate) where.eta.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { planNumber: { contains: search } },
        { vessel: { name: { contains: search } } },
        { port: { name: { contains: search } } },
      ];
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [plans, total] = await Promise.all([
      prisma.berthingPlan.findMany({
        where,
        include: {
          vessel: true,
          port: true,
          terminal: true,
          createdBy: { select: { name: true } },
          _count: { select: { documents: true, tasks: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.berthingPlan.count({ where }),
    ]);

    return {
      data: plans,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async updatePlan(id, data, userId, ipAddress) {
    const oldPlan = await prisma.berthingPlan.findUnique({
      where: { id },
    });

    if (!oldPlan) {
      throw new NotFoundError('靠泊计划不存在');
    }

    if (oldPlan.status === 'COMPLETED' || oldPlan.status === 'CANCELLED') {
      throw new ConflictError(`${oldPlan.status === 'COMPLETED' ? '已完成' : '已取消'}的计划无法修改`);
    }

    if (!oldPlan.isLatestVersion) {
      throw new ConflictError('只能修改最新版本的计划');
    }

    const newVersion = oldPlan.chainVersion + 1;

    await prisma.berthingPlan.update({
      where: { id },
      data: { isLatestVersion: false },
    });

    const newPlan = await prisma.berthingPlan.create({
      data: {
        ...oldPlan,
        id: undefined,
        planNumber: oldPlan.planNumber,
        ...data,
        eta: data.eta ? new Date(data.eta) : oldPlan.eta,
        etd: data.etd ? new Date(data.etd) : oldPlan.etd,
        chainVersion: newVersion,
        isLatestVersion: true,
        parentId: oldPlan.id,
        createdById: userId,
      },
      include: {
        vessel: true,
        port: true,
        terminal: true,
      },
    });

    const changes = Object.keys(data).filter(key => oldPlan[key] !== data[key]);
    await auditService.log('UPDATE', 'BerthingPlan', newPlan.id, userId, {
      oldValues: oldPlan,
      newValues: newPlan,
      changes,
      ipAddress,
      remarks: `更新靠泊计划 (版本 ${newVersion})`,
    });

    return newPlan;
  },

  async updateStatus(id, status, userId, ipAddress, remarks = '') {
    const plan = await prisma.berthingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError('靠泊计划不存在');
    }

    const validTransitions = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['APPROVED', 'REJECTED'],
      APPROVED: ['CONFIRMED', 'REJECTED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED'],
    };

    if (!validTransitions[plan.status]?.includes(status)) {
      throw new ConflictError(`无法从 ${plan.status} 状态转换到 ${status}`);
    }

    const updatedPlan = await prisma.berthingPlan.update({
      where: { id },
      data: { status },
      include: {
        vessel: true,
        port: true,
      },
    });

    const actionMap = {
      SUBMITTED: 'SUBMIT',
      APPROVED: 'APPROVE',
      REJECTED: 'REJECT',
      CONFIRMED: 'STATUS_CHANGE',
      IN_PROGRESS: 'STATUS_CHANGE',
      COMPLETED: 'STATUS_CHANGE',
      CANCELLED: 'STATUS_CHANGE',
    };

    await auditService.log(actionMap[status] || 'STATUS_CHANGE', 'BerthingPlan', id, userId, {
      oldValues: { status: plan.status },
      newValues: { status },
      ipAddress,
      remarks: remarks || `状态变更: ${plan.status} → ${status}`,
    });

    return updatedPlan;
  },

  async getDashboardStats() {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [statusStats, thisWeek, upcoming] = await Promise.all([
      prisma.berthingPlan.groupBy({
        by: ['status'],
        where: { isLatestVersion: true },
        _count: true,
      }),
      prisma.berthingPlan.count({
        where: {
          isLatestVersion: true,
          createdAt: { gte: weekStart },
        },
      }),
      prisma.berthingPlan.count({
        where: {
          isLatestVersion: true,
          eta: { gte: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);

    const statusMap = {};
    statusStats.forEach(s => { statusMap[s.status] = s._count; });

    return {
      statusBreakdown: statusMap,
      thisWeekNew: thisWeek,
      upcomingBerthings: upcoming,
    };
  },
};

export default berthingService;
