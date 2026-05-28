import prisma from '../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const supplyService = {
  async createSupplyRequest(data, userId, ipAddress) {
    const { berthingPlanId, category, description, quantity, unit, estimatedCost, supplierId, remarks } = data;

    if (quantity <= 0) {
      throw new ValidationError('数量必须大于0');
    }

    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('关联的靠泊计划不存在');
    }

    const supplyRequest = await prisma.supplyRequest.create({
      data: {
        berthingPlanId,
        chainId: berthingPlan.chainId,
        category,
        description,
        quantity,
        unit,
        estimatedCost,
        supplierId,
        remarks,
        createdById: userId,
      },
      include: {
        berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
        supplier: true,
        createdBy: { select: { name: true } },
      },
    });

    await auditService.log('CREATE', 'SupplyRequest', supplyRequest.id, userId, {
      chainId: supplyRequest.chainId,
      newValues: supplyRequest,
      ipAddress,
      remarks: `创建补给申请: ${category}`,
    });

    return supplyRequest;
  },

  async getSupplyRequest(id) {
    const supplyRequest = await prisma.supplyRequest.findUnique({
      where: { id },
      include: {
        berthingPlan: {
          include: { vessel: true, port: true },
        },
        supplier: true,
        createdBy: { select: { name: true, role: true } },
      },
    });

    if (!supplyRequest) {
      throw new NotFoundError('补给申请不存在');
    }

    return supplyRequest;
  },

  async getSupplyRequests(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { berthingPlanId, status, category, supplierId } = filters;

    const where = {};

    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (supplierId) where.supplierId = supplierId;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [supplyRequests, total] = await Promise.all([
      prisma.supplyRequest.findMany({
        where,
        include: {
          berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
          supplier: true,
          createdBy: { select: { name: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supplyRequest.count({ where }),
    ]);

    return {
      data: supplyRequests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async updateSupplyRequest(id, data, userId, ipAddress) {
    const oldRequest = await prisma.supplyRequest.findUnique({
      where: { id },
    });

    if (!oldRequest) {
      throw new NotFoundError('补给申请不存在');
    }

    if (oldRequest.status === 'DELIVERED' || oldRequest.status === 'COMPLETED') {
      throw new ConflictError('已交付或已完成的申请无法修改');
    }

    const updatedRequest = await prisma.supplyRequest.update({
      where: { id },
      data,
      include: {
        berthingPlan: { select: { planNumber: true } },
        supplier: true,
      },
    });

    const changes = Object.keys(data).filter(key => oldRequest[key] !== data[key]);
    if (changes.length > 0) {
      await auditService.log('UPDATE', 'SupplyRequest', id, userId, {
        chainId: oldRequest.chainId,
        oldValues: oldRequest,
        newValues: updatedRequest,
        changes,
        ipAddress,
        remarks: '更新补给申请信息',
      });
    }

    return updatedRequest;
  },

  async updateStatus(id, status, userId, ipAddress) {
    const supplyRequest = await prisma.supplyRequest.findUnique({
      where: { id },
    });

    if (!supplyRequest) {
      throw new NotFoundError('补给申请不存在');
    }

    const validTransitions = {
      REQUESTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
      APPROVED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['DELIVERED', 'DELAYED'],
      DELIVERED: ['COMPLETED'],
      DELAYED: ['IN_PROGRESS', 'CANCELLED'],
    };

    if (!validTransitions[supplyRequest.status]?.includes(status)) {
      throw new ConflictError(`无法从 ${supplyRequest.status} 状态转换到 ${status}`);
    }

    const updateData = { status };
    if (status === 'DELIVERED') {
      updateData.deliveredDate = new Date();
    }

    const updatedRequest = await prisma.supplyRequest.update({
      where: { id },
      data: updateData,
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    await auditService.log('STATUS_CHANGE', 'SupplyRequest', id, userId, {
      chainId: supplyRequest.chainId,
      oldValues: { status: supplyRequest.status },
      newValues: { status },
      ipAddress,
      remarks: `补给申请状态变更: ${supplyRequest.status} → ${status}`,
    });

    return updatedRequest;
  },

  async deleteSupplyRequest(id, userId, ipAddress) {
    const supplyRequest = await prisma.supplyRequest.findUnique({
      where: { id },
    });

    if (!supplyRequest) {
      throw new NotFoundError('补给申请不存在');
    }

    if (supplyRequest.status === 'DELIVERED' || supplyRequest.status === 'COMPLETED') {
      throw new ConflictError('已交付或已完成的申请无法删除');
    }

    await prisma.supplyRequest.delete({
      where: { id },
    });

    await auditService.log('DELETE', 'SupplyRequest', id, userId, {
      chainId: supplyRequest.chainId,
      oldValues: supplyRequest,
      ipAddress,
      remarks: '删除补给申请',
    });

    return { success: true };
  },
};

export default supplyService;
