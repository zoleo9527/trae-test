const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { NotFoundError, BusinessError, ConflictError } = require('../utils/errors');
const { logAction, logChanges, AuditAction, EntityType } = require('./auditService');

const BorrowStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BORROWED: 'BORROWED',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
};

const BorrowTransitionRules = {
  [BorrowStatus.PENDING]: [BorrowStatus.APPROVED, BorrowStatus.REJECTED],
  [BorrowStatus.APPROVED]: [BorrowStatus.BORROWED, BorrowStatus.REJECTED],
  [BorrowStatus.BORROWED]: [BorrowStatus.RETURNED, BorrowStatus.OVERDUE],
  [BorrowStatus.RETURNED]: [],
  [BorrowStatus.REJECTED]: [],
  [BorrowStatus.OVERDUE]: [BorrowStatus.RETURNED],
};

const validateBorrowTransition = (oldStatus, newStatus) => {
  const allowedTransitions = BorrowTransitionRules[oldStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BusinessError(
      `Cannot transition from ${oldStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
};

const createEquipment = async (data, userId, { ipAddress, userAgent, requestId }) => {
  const equipment = await prisma.equipment.create({
    data: {
      ...data,
      availableQty: data.quantity,
    },
  });

  await logAction({
    userId,
    action: AuditAction.CREATE,
    entityType: EntityType.EQUIPMENT,
    entityId: equipment.id,
    newValue: data,
    changeSummary: `Created equipment: ${data.name}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Equipment ${equipment.id} created by user ${userId}`);

  return equipment;
};

const getEquipmentById = async (id) => {
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      borrowRecords: {
        orderBy: { createdAt: 'desc' },
        include: {
          schedule: { select: { id: true, performanceName: true } },
          requestedBy: { select: { id: true, name: true, role: true } },
          approvedBy: { select: { id: true, name: true, role: true } },
        },
      },
      remarks: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!equipment) {
    throw new NotFoundError('Equipment not found');
  }

  return equipment;
};

const getEquipments = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.category) where.category = { contains: filters.category };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const [equipments, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.equipment.count({ where }),
  ]);

  return { equipments, total };
};

const updateEquipment = async (id, data, userId, { ipAddress, userAgent, requestId }) => {
  const oldEquipment = await prisma.equipment.findUnique({ where: { id } });
  if (!oldEquipment) {
    throw new NotFoundError('Equipment not found');
  }

  const equipment = await prisma.equipment.update({
    where: { id },
    data,
  });

  const fieldsToTrack = ['name', 'category', 'specification', 'quantity', 'availableQty', 'location', 'description', 'isActive'];
  await logChanges({
    userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.EQUIPMENT,
    entityId: id,
    oldData: oldEquipment,
    newData: data,
    fields: fieldsToTrack,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Equipment ${id} updated by user ${userId}`);

  return equipment;
};

const createBorrowRequest = async (data, userId, { ipAddress, userAgent, requestId }) => {
  const [equipment, schedule] = await Promise.all([
    prisma.equipment.findUnique({ where: { id: data.equipmentId } }),
    prisma.schedule.findUnique({ where: { id: data.scheduleId } }),
  ]);

  if (!equipment) {
    throw new NotFoundError('Equipment not found');
  }

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (!equipment.isActive) {
    throw new BusinessError('Equipment is not available', 'EQUIPMENT_INACTIVE');
  }

  if (data.borrowQty > equipment.availableQty) {
    throw new ConflictError(`Insufficient equipment available. Available: ${equipment.availableQty}, Requested: ${data.borrowQty}`);
  }

  const borrow = await prisma.equipmentBorrow.create({
    data: {
      ...data,
      status: BorrowStatus.PENDING,
      requestedById: userId,
    },
    include: {
      equipment: true,
      schedule: { select: { id: true, performanceName: true } },
      requestedBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  await prisma.borrowStatusHistory.create({
    data: {
      borrowId: borrow.id,
      oldStatus: null,
      newStatus: BorrowStatus.PENDING,
      changedById: userId,
      changeReason: 'Borrow request created',
    },
  });

  await logAction({
    userId,
    action: AuditAction.CREATE,
    entityType: EntityType.EQUIPMENT_BORROW,
    entityId: borrow.id,
    newValue: data,
    changeSummary: `Created borrow request for ${equipment.name} (Qty: ${data.borrowQty})`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Borrow request ${borrow.id} created by user ${userId}`);

  return borrow;
};

const getBorrowById = async (id) => {
  const borrow = await prisma.equipmentBorrow.findUnique({
    where: { id },
    include: {
      equipment: true,
      schedule: { select: { id: true, performanceName: true } },
      requestedBy: { select: { id: true, name: true, username: true, role: true } },
      approvedBy: { select: { id: true, name: true, username: true, role: true } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: { changedBy: { select: { id: true, name: true, role: true } } },
      },
      remarks: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!borrow) {
    throw new NotFoundError('Borrow record not found');
  }

  return borrow;
};

const getBorrows = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.scheduleId) where.scheduleId = filters.scheduleId;
  if (filters.equipmentId) where.equipmentId = filters.equipmentId;
  if (filters.requestedById) where.requestedById = filters.requestedById;

  const [borrows, total] = await Promise.all([
    prisma.equipmentBorrow.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: { select: { id: true, name: true } },
        schedule: { select: { id: true, performanceName: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.equipmentBorrow.count({ where }),
  ]);

  return { borrows, total };
};

const approveBorrow = async (id, supplementNote, userId, { ipAddress, userAgent, requestId }) => {
  const oldBorrow = await prisma.equipmentBorrow.findUnique({
    where: { id },
    include: { equipment: true },
  });

  if (!oldBorrow) {
    throw new NotFoundError('Borrow record not found');
  }

  validateBorrowTransition(oldBorrow.status, BorrowStatus.APPROVED);

  if (oldBorrow.borrowQty > oldBorrow.equipment.availableQty) {
    throw new ConflictError(`Insufficient equipment available. Available: ${oldBorrow.equipment.availableQty}, Requested: ${oldBorrow.borrowQty}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const borrow = await tx.equipmentBorrow.update({
      where: { id },
      data: {
        status: BorrowStatus.APPROVED,
        approvedById: userId,
        supplementNote,
      },
      include: {
        equipment: true,
        schedule: { select: { id: true, performanceName: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    await tx.equipment.update({
      where: { id: oldBorrow.equipmentId },
      data: {
        availableQty: {
          decrement: oldBorrow.borrowQty,
        },
      },
    });

    await tx.borrowStatusHistory.create({
      data: {
        borrowId: id,
        oldStatus: oldBorrow.status,
        newStatus: BorrowStatus.APPROVED,
        changedById: userId,
        changeReason: supplementNote || 'Approved',
      },
    });

    return borrow;
  });

  await logAction({
    userId,
    action: AuditAction.APPROVE,
    entityType: EntityType.EQUIPMENT_BORROW,
    entityId: id,
    fieldName: 'status',
    oldValue: oldBorrow.status,
    newValue: BorrowStatus.APPROVED,
    changeSummary: `Borrow request approved. ${supplementNote ? `Note: ${supplementNote}` : ''}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Borrow ${id} approved by user ${userId}`);

  return result;
};

const rejectBorrow = async (id, rejectReason, userId, { ipAddress, userAgent, requestId }) => {
  const oldBorrow = await prisma.equipmentBorrow.findUnique({ where: { id } });
  if (!oldBorrow) {
    throw new NotFoundError('Borrow record not found');
  }

  validateBorrowTransition(oldBorrow.status, BorrowStatus.REJECTED);

  const result = await prisma.$transaction(async (tx) => {
    const borrow = await tx.equipmentBorrow.update({
      where: { id },
      data: {
        status: BorrowStatus.REJECTED,
        rejectReason,
      },
      include: {
        equipment: true,
        schedule: { select: { id: true, performanceName: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    await tx.borrowStatusHistory.create({
      data: {
        borrowId: id,
        oldStatus: oldBorrow.status,
        newStatus: BorrowStatus.REJECTED,
        changedById: userId,
        changeReason: rejectReason,
      },
    });

    return borrow;
  });

  await logAction({
    userId,
    action: AuditAction.REJECT,
    entityType: EntityType.EQUIPMENT_BORROW,
    entityId: id,
    fieldName: 'status',
    oldValue: oldBorrow.status,
    newValue: BorrowStatus.REJECTED,
    changeSummary: `Borrow request rejected. Reason: ${rejectReason}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Borrow ${id} rejected by user ${userId}`);

  return result;
};

const markAsBorrowed = async (id, userId, { ipAddress, userAgent, requestId }) => {
  const oldBorrow = await prisma.equipmentBorrow.findUnique({ where: { id } });
  if (!oldBorrow) {
    throw new NotFoundError('Borrow record not found');
  }

  validateBorrowTransition(oldBorrow.status, BorrowStatus.BORROWED);

  const result = await prisma.$transaction(async (tx) => {
    const borrow = await tx.equipmentBorrow.update({
      where: { id },
      data: {
        status: BorrowStatus.BORROWED,
      },
      include: {
        equipment: true,
        schedule: { select: { id: true, performanceName: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    await tx.borrowStatusHistory.create({
      data: {
        borrowId: id,
        oldStatus: oldBorrow.status,
        newStatus: BorrowStatus.BORROWED,
        changedById: userId,
        changeReason: 'Equipment picked up',
      },
    });

    return borrow;
  });

  await logAction({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.EQUIPMENT_BORROW,
    entityId: id,
    fieldName: 'status',
    oldValue: oldBorrow.status,
    newValue: BorrowStatus.BORROWED,
    changeSummary: 'Equipment picked up and marked as borrowed',
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Borrow ${id} marked as BORROWED by user ${userId}`);

  return result;
};

const returnBorrow = async (id, actualReturnDate, userId, { ipAddress, userAgent, requestId }) => {
  const oldBorrow = await prisma.equipmentBorrow.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!oldBorrow) {
    throw new NotFoundError('Borrow record not found');
  }

  validateBorrowTransition(oldBorrow.status, BorrowStatus.RETURNED);

  const result = await prisma.$transaction(async (tx) => {
    const borrow = await tx.equipmentBorrow.update({
      where: { id },
      data: {
        status: BorrowStatus.RETURNED,
        actualReturnDate: actualReturnDate || new Date(),
      },
      include: {
        equipment: true,
        schedule: { select: { id: true, performanceName: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    await tx.equipment.update({
      where: { id: oldBorrow.equipmentId },
      data: {
        availableQty: {
          increment: oldBorrow.borrowQty,
        },
      },
    });

    await tx.borrowStatusHistory.create({
      data: {
        borrowId: id,
        oldStatus: oldBorrow.status,
        newStatus: BorrowStatus.RETURNED,
        changedById: userId,
        changeReason: 'Equipment returned',
      },
    });

    return borrow;
  });

  await logAction({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.EQUIPMENT_BORROW,
    entityId: id,
    fieldName: 'status',
    oldValue: oldBorrow.status,
    newValue: BorrowStatus.RETURNED,
    changeSummary: 'Equipment returned successfully',
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Borrow ${id} marked as RETURNED by user ${userId}`);

  return result;
};

const supplementBorrow = async (id, supplementNote, userId, { ipAddress, userAgent, requestId }) => {
  const borrow = await prisma.equipmentBorrow.findUnique({ where: { id } });
  if (!borrow) {
    throw new NotFoundError('Borrow record not found');
  }

  const updatedBorrow = await prisma.equipmentBorrow.update({
    where: { id },
    data: {
      supplementNote: borrow.supplementNote
        ? `${borrow.supplementNote}\n\n${new Date().toISOString()}: ${supplementNote}`
        : supplementNote,
    },
    include: {
      equipment: true,
      schedule: { select: { id: true, performanceName: true } },
      requestedBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true, role: true } },
    },
  });

  await logAction({
    userId,
    action: AuditAction.SUPPLEMENT,
    entityType: EntityType.EQUIPMENT_BORROW,
    entityId: id,
    fieldName: 'supplementNote',
    newValue: supplementNote,
    changeSummary: `Supplement added: ${supplementNote}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Borrow ${id} supplemented by user ${userId}`);

  return updatedBorrow;
};

const getBorrowStatusHistory = async (borrowId) => {
  return prisma.borrowStatusHistory.findMany({
    where: { borrowId },
    orderBy: { createdAt: 'asc' },
    include: {
      changedBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });
};

module.exports = {
  BorrowStatus,
  BorrowTransitionRules,
  createEquipment,
  getEquipmentById,
  getEquipments,
  updateEquipment,
  createBorrowRequest,
  getBorrowById,
  getBorrows,
  approveBorrow,
  rejectBorrow,
  markAsBorrowed,
  returnBorrow,
  supplementBorrow,
  getBorrowStatusHistory,
};
