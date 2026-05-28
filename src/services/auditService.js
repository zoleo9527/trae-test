import prisma from '../config/prisma.js';

const auditService = {
  async log(action, entityType, entityId, userId, data = {}) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          chainId: data.chainId,
          userId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          changes: data.changes,
          remarks: data.remarks,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  async getChainAuditTrail(chainId, options = {}) {
    const { page = 1, pageSize = 50 } = options;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          OR: [
            { chainId },
            { entityType: 'BerthingPlan', entityId: chainId },
          ],
        },
        include: {
          user: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({
        where: {
          OR: [
            { chainId },
            { entityType: 'BerthingPlan', entityId: chainId },
          ],
        },
      }),
    ]);

    return {
      chainId,
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getEntityHistory(entityType, entityId, options = {}) {
    const { page = 1, pageSize = 20 } = options;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityType, entityId },
        include: {
          user: {
            select: { name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where: { entityType, entityId } }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getUserActivity(userId, options = {}) {
    const { page = 1, pageSize = 20, startDate, endDate, entityType, action } = options;

    const where = { userId };
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getAuditLogs(filters = {}, options = {}) {
    const { page = 1, pageSize = 20 } = options;
    const { chainId, entityType, action, userId, startDate, endDate } = filters;

    const where = {};
    if (chainId) {
      where.OR = [
        { chainId },
        { entityType: 'BerthingPlan', entityId: chainId },
      ];
    }
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getAuditSummary(options = {}) {
    const { startDate, endDate, userId, chainId } = options;

    const where = {};
    if (chainId) {
      where.OR = [
        { chainId },
        { entityType: 'BerthingPlan', entityId: chainId },
      ];
    }
    if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      select: { action: true, entityType: true },
    });

    const actionSummary = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const entitySummary = logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {});

    return {
      total: logs.length,
      actionSummary,
      entitySummary,
    };
  },
};

export default auditService;
