const prisma = require('../config/prisma');
const logger = require('../config/logger');

const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  REMARK: 'REMARK',
  SUPPLEMENT: 'SUPPLEMENT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

const EntityType = {
  USER: 'User',
  SCHEDULE: 'Schedule',
  EQUIPMENT: 'Equipment',
  EQUIPMENT_BORROW: 'EquipmentBorrow',
  PERFORMANCE_REVIEW: 'PerformanceReview',
  REVIEW_ISSUE: 'ReviewIssue',
  GROUP_ORDER: 'GroupOrder',
  REMARK: 'Remark',
};

const logAction = async ({
  userId,
  action,
  entityType,
  entityId,
  fieldName = null,
  oldValue = null,
  newValue = null,
  changeSummary = null,
  ipAddress = null,
  userAgent = null,
  requestId = null,
}) => {
  try {
    const oldVal = oldValue !== null && typeof oldValue === 'object'
      ? JSON.stringify(oldValue)
      : oldValue;
    const newVal = newValue !== null && typeof newValue === 'object'
      ? JSON.stringify(newValue)
      : newValue;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        fieldName,
        oldValue: oldVal,
        newValue: newVal,
        changeSummary,
        ipAddress,
        userAgent,
        requestId,
      },
    });

    logger.info(`Audit log: ${action} on ${entityType} ${entityId} by user ${userId}`, {
      action,
      entityType,
      entityId,
      userId,
      changeSummary,
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

const logChanges = async ({
  userId,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  fields,
  ipAddress = null,
  userAgent = null,
  requestId = null,
}) => {
  const changes = [];

  for (const field of fields) {
    const oldVal = oldData[field];
    const newVal = newData[field];

    if (oldVal !== newVal) {
      changes.push({ field, oldVal, newVal });
    }
  }

  if (changes.length === 0) return;

  const summary = changes
    .map(c => `${c.field}: ${c.oldVal} → ${c.newVal}`)
    .join('; ');

  for (const change of changes) {
    await logAction({
      userId,
      action,
      entityType,
      entityId,
      fieldName: change.field,
      oldValue: change.oldVal,
      newValue: change.newVal,
      changeSummary: summary,
      ipAddress,
      userAgent,
      requestId,
    });
  }
};

const getAuditLogs = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
};

const getEntityAuditTrail = async (entityType, entityId) => {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, name: true, username: true, role: true },
      },
    },
  });
};

module.exports = {
  AuditAction,
  EntityType,
  logAction,
  logChanges,
  getAuditLogs,
  getEntityAuditTrail,
};
