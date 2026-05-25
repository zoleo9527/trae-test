const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { NotFoundError, BusinessError } = require('../utils/errors');
const { logAction, logChanges, AuditAction, EntityType } = require('./auditService');

const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUND_APPROVED: 'REFUND_APPROVED',
  REFUND_REJECTED: 'REFUND_REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const OrderTransitionRules = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.REFUND_REQUESTED, OrderStatus.CANCELLED, OrderStatus.COMPLETED],
  [OrderStatus.PAID]: [OrderStatus.REFUND_REQUESTED, OrderStatus.COMPLETED],
  [OrderStatus.REFUND_REQUESTED]: [OrderStatus.REFUND_APPROVED, OrderStatus.REFUND_REJECTED],
  [OrderStatus.REFUND_APPROVED]: [OrderStatus.CANCELLED],
  [OrderStatus.REFUND_REJECTED]: [OrderStatus.PAID, OrderStatus.CONFIRMED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

const validateOrderTransition = (oldStatus, newStatus) => {
  const allowedTransitions = OrderTransitionRules[oldStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BusinessError(
      `Cannot transition from ${oldStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
};

const createOrder = async (data, userId, { ipAddress, userAgent, requestId }) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (schedule.status === 'CANCELLED') {
    throw new BusinessError('Cannot create order for cancelled schedule', 'SCHEDULE_CANCELLED');
  }

  const order = await prisma.groupOrder.create({
    data: {
      ...data,
      status: OrderStatus.PENDING,
      createdById: userId,
    },
    include: {
      schedule: { select: { id: true, performanceName: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      oldStatus: null,
      newStatus: OrderStatus.PENDING,
      changedById: userId,
      changeReason: 'Order created',
    },
  });

  await logAction({
    userId,
    action: AuditAction.CREATE,
    entityType: EntityType.GROUP_ORDER,
    entityId: order.id,
    newValue: data,
    changeSummary: `Created order for ${data.groupName} (${data.ticketCount} tickets)`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${order.id} created by user ${userId}`);

  return order;
};

const getOrderById = async (id) => {
  const order = await prisma.groupOrder.findUnique({
    where: { id },
    include: {
      schedule: { select: { id: true, performanceName: true, startTime: true, venue: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } },
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

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
};

const getOrders = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.scheduleId) where.scheduleId = filters.scheduleId;
  if (filters.createdById) where.createdById = filters.createdById;

  const [orders, total] = await Promise.all([
    prisma.groupOrder.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.groupOrder.count({ where }),
  ]);

  return { orders, total };
};

const updateOrder = async (id, data, userId, { ipAddress, userAgent, requestId }) => {
  const oldOrder = await prisma.groupOrder.findUnique({ where: { id } });
  if (!oldOrder) {
    throw new NotFoundError('Order not found');
  }

  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(oldOrder.status)) {
    throw new BusinessError('Can only update PENDING or CONFIRMED orders', 'INVALID_ORDER_STATUS');
  }

  const order = await prisma.groupOrder.update({
    where: { id },
    data,
    include: {
      schedule: { select: { id: true, performanceName: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  const fieldsToTrack = ['groupName', 'contactPerson', 'contactPhone', 'ticketCount', 'unitPrice', 'totalAmount', 'actualPaid'];
  await logChanges({
    userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.GROUP_ORDER,
    entityId: id,
    oldData: oldOrder,
    newData: data,
    fields: fieldsToTrack,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${id} updated by user ${userId}`);

  return order;
};

const changeOrderStatus = async (id, newStatus, changeReason, userId, { ipAddress, userAgent, requestId }) => {
  const oldOrder = await prisma.groupOrder.findUnique({ where: { id } });
  if (!oldOrder) {
    throw new NotFoundError('Order not found');
  }

  if (oldOrder.status === newStatus) {
    return oldOrder;
  }

  validateOrderTransition(oldOrder.status, newStatus);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.groupOrder.update({
      where: { id },
      data: { status: newStatus },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: oldOrder.status,
        newStatus,
        changedById: userId,
        changeReason,
      },
    });

    return order;
  });

  await logAction({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.GROUP_ORDER,
    entityId: id,
    fieldName: 'status',
    oldValue: oldOrder.status,
    newValue: newStatus,
    changeSummary: `Status changed: ${oldOrder.status} → ${newStatus}. Reason: ${changeReason || 'N/A'}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${id} status changed from ${oldOrder.status} to ${newStatus} by user ${userId}`);

  return result;
};

const approveOrder = async (id, changeReason, userId, { ipAddress, userAgent, requestId }) => {
  return changeOrderStatus(id, OrderStatus.CONFIRMED, changeReason, userId, { ipAddress, userAgent, requestId });
};

const rejectOrder = async (id, rejectReason, userId, { ipAddress, userAgent, requestId }) => {
  const oldOrder = await prisma.groupOrder.findUnique({ where: { id } });
  if (!oldOrder) {
    throw new NotFoundError('Order not found');
  }

  validateOrderTransition(oldOrder.status, OrderStatus.CANCELLED);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.groupOrder.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        rejectReason,
      },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: oldOrder.status,
        newStatus: OrderStatus.CANCELLED,
        changedById: userId,
        changeReason: rejectReason,
      },
    });

    return order;
  });

  await logAction({
    userId,
    action: AuditAction.REJECT,
    entityType: EntityType.GROUP_ORDER,
    entityId: id,
    fieldName: 'status',
    oldValue: oldOrder.status,
    newValue: OrderStatus.CANCELLED,
    changeSummary: `Order rejected. Reason: ${rejectReason}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${id} rejected by user ${userId}`);

  return result;
};

const markPaid = async (id, actualPaid, userId, { ipAddress, userAgent, requestId }) => {
  const oldOrder = await prisma.groupOrder.findUnique({ where: { id } });
  if (!oldOrder) {
    throw new NotFoundError('Order not found');
  }

  validateOrderTransition(oldOrder.status, OrderStatus.PAID);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.groupOrder.update({
      where: { id },
      data: {
        status: OrderStatus.PAID,
        actualPaid,
      },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: oldOrder.status,
        newStatus: OrderStatus.PAID,
        changedById: userId,
        changeReason: `Payment received: ${actualPaid}`,
      },
    });

    return order;
  });

  await logAction({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.GROUP_ORDER,
    entityId: id,
    fieldName: 'actualPaid',
    newValue: actualPaid,
    changeSummary: `Marked as paid, amount: ${actualPaid}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${id} marked as PAID by user ${userId}`);

  return result;
};

const requestRefund = async (id, refundReason, refundAmount, userId, { ipAddress, userAgent, requestId }) => {
  const oldOrder = await prisma.groupOrder.findUnique({ where: { id } });
  if (!oldOrder) {
    throw new NotFoundError('Order not found');
  }

  validateOrderTransition(oldOrder.status, OrderStatus.REFUND_REQUESTED);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.groupOrder.update({
      where: { id },
      data: {
        status: OrderStatus.REFUND_REQUESTED,
        refundReason,
        refundAmount,
      },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: oldOrder.status,
        newStatus: OrderStatus.REFUND_REQUESTED,
        changedById: userId,
        changeReason: refundReason,
      },
    });

    return order;
  });

  await logAction({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.GROUP_ORDER,
    entityId: id,
    fieldName: 'refundAmount',
    newValue: refundAmount,
    changeSummary: `Refund requested: ${refundAmount}. Reason: ${refundReason}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${id} refund requested by user ${userId}`);

  return result;
};

const approveRefund = async (id, changeReason, userId, { ipAddress, userAgent, requestId }) => {
  return changeOrderStatus(id, OrderStatus.REFUND_APPROVED, changeReason, userId, { ipAddress, userAgent, requestId });
};

const rejectRefund = async (id, rejectReason, userId, { ipAddress, userAgent, requestId }) => {
  const oldOrder = await prisma.groupOrder.findUnique({ where: { id } });
  if (!oldOrder) {
    throw new NotFoundError('Order not found');
  }

  validateOrderTransition(oldOrder.status, OrderStatus.REFUND_REJECTED);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.groupOrder.update({
      where: { id },
      data: {
        status: OrderStatus.REFUND_REJECTED,
      },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        oldStatus: oldOrder.status,
        newStatus: OrderStatus.REFUND_REJECTED,
        changedById: userId,
        changeReason: rejectReason,
      },
    });

    return order;
  });

  await logAction({
    userId,
    action: AuditAction.REJECT,
    entityType: EntityType.GROUP_ORDER,
    entityId: id,
    fieldName: 'status',
    oldValue: oldOrder.status,
    newValue: OrderStatus.REFUND_REJECTED,
    changeSummary: `Refund rejected. Reason: ${rejectReason}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Order ${id} refund rejected by user ${userId}`);

  return result;
};

const getStatusHistory = async (orderId) => {
  return prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
    include: {
      changedBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });
};

module.exports = {
  OrderStatus,
  OrderTransitionRules,
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  approveOrder,
  rejectOrder,
  markPaid,
  requestRefund,
  approveRefund,
  rejectRefund,
  getStatusHistory,
  changeOrderStatus,
};
