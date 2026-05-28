import prisma from '../config/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const communicationService = {
  async createCommunication(data, userId, ipAddress) {
    const { berthingPlanId, type, direction, subject, content, senderName, senderContact, recipientName, recipientContact, supplierId, isInternal } = data;

    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('关联的靠泊计划不存在');
    }

    const communication = await prisma.communication.create({
      data: {
        berthingPlanId,
        chainId: berthingPlan.chainId,
        type,
        direction,
        subject,
        content,
        senderName,
        senderContact,
        recipientName,
        recipientContact,
        supplierId,
        isInternal: isInternal || false,
      },
      include: {
        berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
        supplier: true,
      },
    });

    await auditService.log('CREATE', 'Communication', communication.id, userId, {
      chainId: communication.chainId,
      newValues: communication,
      ipAddress,
      remarks: `创建沟通记录: ${subject}`,
    });

    return communication;
  },

  async getCommunication(id) {
    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        berthingPlan: {
          include: { vessel: true, port: true },
        },
        supplier: true,
      },
    });

    if (!communication) {
      throw new NotFoundError('沟通记录不存在');
    }

    return communication;
  },

  async getCommunications(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { berthingPlanId, type, direction, supplierId, isInternal, startDate, endDate } = filters;

    const where = {};

    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (type) where.type = type;
    if (direction) where.direction = direction;
    if (supplierId) where.supplierId = supplierId;
    if (isInternal !== undefined) where.isInternal = isInternal;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
          supplier: true,
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.communication.count({ where }),
    ]);

    return {
      data: communications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getSupplierCommunications(supplierId, filters = {}) {
    return this.getCommunications({ ...filters, supplierId });
  },

  async deleteCommunication(id, userId, ipAddress) {
    const communication = await prisma.communication.findUnique({
      where: { id },
    });

    if (!communication) {
      throw new NotFoundError('沟通记录不存在');
    }

    await prisma.communication.delete({
      where: { id },
    });

    await auditService.log('DELETE', 'Communication', id, userId, {
      chainId: communication.chainId,
      oldValues: communication,
      ipAddress,
      remarks: '删除沟通记录',
    });

    return { success: true };
  },
};

export default communicationService;
