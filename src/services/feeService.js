import prisma from '../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const feeService = {
  async createFee(data, userId, ipAddress) {
    const { berthingPlanId, category, description, amount, currency, supplierId, invoiceNo, dueDate, remarks } = data;

    if (amount <= 0) {
      throw new ValidationError('金额必须大于0');
    }

    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('关联的靠泊计划不存在');
    }

    const fee = await prisma.fee.create({
      data: {
        berthingPlanId,
        chainId: berthingPlan.chainId,
        category,
        description,
        amount,
        currency: currency || 'CNY',
        supplierId,
        invoiceNo,
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks,
        createdById: userId,
      },
      include: {
        berthingPlan: { select: { planNumber: true } },
        supplier: true,
        createdBy: { select: { name: true } },
      },
    });

    await auditService.log('CREATE', 'Fee', fee.id, userId, {
      chainId: fee.chainId,
      newValues: fee,
      ipAddress,
      remarks: `创建费用: ${category}`,
    });

    return fee;
  },

  async getFee(id) {
    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        berthingPlan: {
          include: { vessel: true, port: true },
        },
        supplier: true,
        createdBy: { select: { name: true, role: true } },
      },
    });

    if (!fee) {
      throw new NotFoundError('费用记录不存在');
    }

    return fee;
  },

  async getFees(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { berthingPlanId, isPaid, category, supplierId, startDate, endDate } = filters;

    const where = {};

    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (category) where.category = category;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
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
      prisma.fee.count({ where }),
    ]);

    return {
      data: fees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async updateFee(id, data, userId, ipAddress) {
    const oldFee = await prisma.fee.findUnique({
      where: { id },
    });

    if (!oldFee) {
      throw new NotFoundError('费用记录不存在');
    }

    if (oldFee.isPaid) {
      throw new ConflictError('已支付的费用无法修改');
    }

    const updatedFee = await prisma.fee.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : oldFee.dueDate,
      },
      include: {
        berthingPlan: { select: { planNumber: true } },
        supplier: true,
      },
    });

    const changes = Object.keys(data).filter(key => oldFee[key] !== data[key]);
    if (changes.length > 0) {
      await auditService.log('UPDATE', 'Fee', id, userId, {
        chainId: oldFee.chainId,
        oldValues: oldFee,
        newValues: updatedFee,
        changes,
        ipAddress,
        remarks: '更新费用信息',
      });
    }

    return updatedFee;
  },

  async markAsPaid(id, paymentRef, userId, ipAddress) {
    const fee = await prisma.fee.findUnique({
      where: { id },
    });

    if (!fee) {
      throw new NotFoundError('费用记录不存在');
    }

    if (fee.isPaid) {
      throw new ConflictError('该费用已支付');
    }

    const updatedFee = await prisma.fee.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: new Date(),
        paymentRef,
      },
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    await auditService.log('STATUS_CHANGE', 'Fee', id, userId, {
      chainId: fee.chainId,
      oldValues: { isPaid: false },
      newValues: { isPaid: true, paymentRef },
      ipAddress,
      remarks: '费用已支付',
    });

    return updatedFee;
  },

  async getOverdueFees() {
    const today = new Date();

    return prisma.fee.findMany({
      where: {
        isPaid: false,
        dueDate: {
          not: null,
          lt: today,
        },
      },
      include: {
        berthingPlan: {
          select: { planNumber: true, vessel: { select: { name: true } } },
        },
        supplier: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  async getFeeStats(berthingPlanId) {
    const where = berthingPlanId ? { berthingPlanId } : {};

    const [all, unpaid] = await Promise.all([
      prisma.fee.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.fee.aggregate({
        where: { ...where, isPaid: false },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalAmount: all._sum.amount?.toString() || '0',
      totalCount: all._count,
      unpaidAmount: unpaid._sum.amount?.toString() || '0',
      unpaidCount: unpaid._count,
      paidAmount: (parseFloat(all._sum.amount || 0) - parseFloat(unpaid._sum.amount || 0)).toString(),
    };
  },

  async deleteFee(id, userId, ipAddress) {
    const fee = await prisma.fee.findUnique({
      where: { id },
    });

    if (!fee) {
      throw new NotFoundError('费用记录不存在');
    }

    if (fee.isPaid) {
      throw new ConflictError('已支付的费用无法删除');
    }

    await prisma.fee.delete({
      where: { id },
    });

    await auditService.log('DELETE', 'Fee', id, userId, {
      chainId: fee.chainId,
      oldValues: fee,
      ipAddress,
      remarks: '删除费用记录',
    });

    return { success: true };
  },
};

export default feeService;
