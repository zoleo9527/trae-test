import prisma from '../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const documentService = {
  async createDocument(data, userId, ipAddress) {
    const { berthingPlanId, type, title, referenceNo, deadline, remarks } = data;

    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('关联的靠泊计划不存在');
    }

    const chainId = berthingPlan.chainId;

    const document = await prisma.document.create({
      data: {
        berthingPlanId,
        type,
        title,
        referenceNo,
        deadline: deadline ? new Date(deadline) : null,
        remarks,
        chainId,
        chainVersion: 1,
        isLatestVersion: true,
        createdById: userId,
      },
      include: {
        berthingPlan: { select: { planNumber: true } },
        createdBy: { select: { name: true } },
      },
    });

    await auditService.log('CREATE', 'Document', document.id, userId, {
      chainId: document.chainId,
      newValues: document,
      ipAddress,
      remarks: `创建证件: ${title}`,
    });

    return document;
  },

  async getDocument(id) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        berthingPlan: {
          include: {
            vessel: true,
            port: true,
          },
        },
        tasks: true,
        createdBy: { select: { name: true, role: true } },
        comments: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('证件不存在');
    }

    return document;
  },

  async getDocuments(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { berthingPlanId, status, type, createdById, expiryWarning } = filters;

    const where = { isLatestVersion: true };

    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (createdById) where.createdById = createdById;

    if (expiryWarning) {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 7);
      where.AND = [
        { expiryDate: { not: null } },
        { expiryDate: { lte: warningDate } },
        { status: { not: 'EXPIRED' } },
      ];
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async updateDocument(id, data, userId, ipAddress) {
    const oldDoc = await prisma.document.findUnique({
      where: { id },
    });

    if (!oldDoc) {
      throw new NotFoundError('证件不存在');
    }

    if (oldDoc.status === 'APPROVED' || oldDoc.status === 'EXPIRED') {
      throw new ConflictError(`${oldDoc.status === 'APPROVED' ? '已审批' : '已过期'}的证件无法修改`);
    }

    if (!oldDoc.isLatestVersion) {
      throw new ConflictError('只能修改最新版本的证件');
    }

    const newVersion = oldDoc.chainVersion + 1;

    await prisma.document.update({
      where: { id },
      data: { isLatestVersion: false },
    });

    const newDoc = await prisma.document.create({
      data: {
        ...oldDoc,
        id: undefined,
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : oldDoc.deadline,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : oldDoc.issuedDate,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : oldDoc.expiryDate,
        chainVersion: newVersion,
        isLatestVersion: true,
        parentId: oldDoc.id,
        createdById: userId,
      },
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    const changes = Object.keys(data).filter(key => oldDoc[key] !== data[key]);
    await auditService.log('UPDATE', 'Document', newDoc.id, userId, {
      chainId: oldDoc.chainId,
      oldValues: oldDoc,
      newValues: newDoc,
      changes,
      ipAddress,
      remarks: `更新证件 (版本 ${newVersion})`,
    });

    return newDoc;
  },

  async updateStatus(id, status, userId, ipAddress, reason = '') {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('证件不存在');
    }

    const validTransitions = {
      NOT_STARTED: ['IN_PROGRESS'],
      IN_PROGRESS: ['SUBMITTED', 'NOT_STARTED'],
      SUBMITTED: ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
      REJECTED: ['IN_PROGRESS'],
      APPROVED: ['EXPIRED'],
    };

    if (!validTransitions[document.status]?.includes(status)) {
      throw new ConflictError(`无法从 ${document.status} 状态转换到 ${status}`);
    }

    const updateData = { status };

    if (status === 'SUBMITTED') {
      updateData.submittedDate = new Date();
    } else if (status === 'APPROVED') {
      updateData.approvedDate = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedReason = reason;
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    const actionMap = {
      SUBMITTED: 'SUBMIT',
      APPROVED: 'APPROVE',
      REJECTED: 'REJECT',
    };

    await auditService.log(actionMap[status] || 'STATUS_CHANGE', 'Document', id, userId, {
      chainId: document.chainId,
      oldValues: { status: document.status },
      newValues: { status },
      ipAddress,
      remarks: reason || `状态变更: ${document.status} → ${status}`,
    });

    return updatedDoc;
  },

  async getDocumentByChain(chainId) {
    return prisma.document.findMany({
      where: { chainId },
      orderBy: { chainVersion: 'desc' },
      include: {
        createdBy: { select: { name: true } },
      },
    });
  },

  async getExpiringDocuments(days = 7) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);

    return prisma.document.findMany({
      where: {
        isLatestVersion: true,
        expiryDate: {
          not: null,
          lte: warningDate,
        },
        status: { notIn: ['EXPIRED', 'REJECTED'] },
      },
      include: {
        berthingPlan: {
          select: { planNumber: true, vessel: { select: { name: true } } },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  },
};

export default documentService;
