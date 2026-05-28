import prisma from '../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const crewService = {
  async createCrewChange(data, userId, ipAddress) {
    const { berthingPlanId, type, crewName, position, nationality, passportNo, visaNo, remarks } = data;

    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('关联的靠泊计划不存在');
    }

    const crewChange = await prisma.crewChange.create({
      data: {
        berthingPlanId,
        chainId: berthingPlan.chainId,
        type,
        crewName,
        position,
        nationality,
        passportNo,
        visaNo,
        remarks,
        createdById: userId,
      },
      include: {
        berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
        createdBy: { select: { name: true } },
      },
    });

    await auditService.log('CREATE', 'CrewChange', crewChange.id, userId, {
      chainId: crewChange.chainId,
      newValues: crewChange,
      ipAddress,
      remarks: `创建船员换班: ${crewName}`,
    });

    return crewChange;
  },

  async getCrewChange(id) {
    const crewChange = await prisma.crewChange.findUnique({
      where: { id },
      include: {
        berthingPlan: {
          include: { vessel: true, port: true },
        },
        createdBy: { select: { name: true, role: true } },
      },
    });

    if (!crewChange) {
      throw new NotFoundError('船员换班记录不存在');
    }

    return crewChange;
  },

  async getCrewChanges(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { berthingPlanId, status, type, nationality } = filters;

    const where = {};

    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (nationality) where.nationality = nationality;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [crewChanges, total] = await Promise.all([
      prisma.crewChange.findMany({
        where,
        include: {
          berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.crewChange.count({ where }),
    ]);

    return {
      data: crewChanges,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async updateCrewChange(id, data, userId, ipAddress) {
    const oldCrew = await prisma.crewChange.findUnique({
      where: { id },
    });

    if (!oldCrew) {
      throw new NotFoundError('船员换班记录不存在');
    }

    if (oldCrew.status === 'APPROVED') {
      throw new ConflictError('已批准的换班记录无法修改');
    }

    const updatedCrew = await prisma.crewChange.update({
      where: { id },
      data,
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    const changes = Object.keys(data).filter(key => oldCrew[key] !== data[key]);
    if (changes.length > 0) {
      await auditService.log('UPDATE', 'CrewChange', id, userId, {
        chainId: oldCrew.chainId,
        oldValues: oldCrew,
        newValues: updatedCrew,
        changes,
        ipAddress,
        remarks: '更新船员换班信息',
      });
    }

    return updatedCrew;
  },

  async updateStatus(id, status, userId, ipAddress) {
    const crewChange = await prisma.crewChange.findUnique({
      where: { id },
    });

    if (!crewChange) {
      throw new NotFoundError('船员换班记录不存在');
    }

    const validTransitions = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
    };

    if (!validTransitions[crewChange.status]?.includes(status)) {
      throw new ConflictError(`无法从 ${crewChange.status} 状态转换到 ${status}`);
    }

    const updateData = { status };
    if (status === 'APPROVED') {
      updateData.approvedDate = new Date();
    }

    const updatedCrew = await prisma.crewChange.update({
      where: { id },
      data: updateData,
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    await auditService.log('STATUS_CHANGE', 'CrewChange', id, userId, {
      chainId: crewChange.chainId,
      oldValues: { status: crewChange.status },
      newValues: { status },
      ipAddress,
      remarks: `船员换班状态变更: ${crewChange.status} → ${status}`,
    });

    return updatedCrew;
  },

  async deleteCrewChange(id, userId, ipAddress) {
    const crewChange = await prisma.crewChange.findUnique({
      where: { id },
    });

    if (!crewChange) {
      throw new NotFoundError('船员换班记录不存在');
    }

    if (crewChange.status === 'APPROVED' || crewChange.status === 'COMPLETED') {
      throw new ConflictError('已批准或已完成的换班记录无法删除');
    }

    await prisma.crewChange.delete({
      where: { id },
    });

    await auditService.log('DELETE', 'CrewChange', id, userId, {
      chainId: crewChange.chainId,
      oldValues: crewChange,
      ipAddress,
      remarks: '删除船员换班记录',
    });

    return { success: true };
  },
};

export default crewService;
