const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { logAction, AuditAction, EntityType } = require('./auditService');

const EntityMap = {
  schedule: { entityType: EntityType.SCHEDULE, field: 'scheduleId' },
  equipment: { entityType: EntityType.EQUIPMENT, field: 'equipmentId' },
  borrow: { entityType: EntityType.EQUIPMENT_BORROW, field: 'borrowId' },
  review: { entityType: EntityType.PERFORMANCE_REVIEW, field: 'reviewId' },
  issue: { entityType: EntityType.REVIEW_ISSUE, field: 'issueId' },
  order: { entityType: EntityType.GROUP_ORDER, field: 'orderId' },
};

const addRemark = async ({
  entityType,
  entityId,
  content,
  isSupplement = false,
  userId,
  ipAddress = null,
  userAgent = null,
  requestId = null,
}) => {
  const entityConfig = EntityMap[entityType];
  if (!entityConfig) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  const entity = await prisma[entityConfig.entityType].findUnique({
    where: { id: entityId },
  });

  if (!entity) {
    throw new NotFoundError(`${entityConfig.entityType} not found`);
  }

  const remark = await prisma.remark.create({
    data: {
      content,
      isSupplement,
      createdById: userId,
      [entityConfig.field]: entityId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, username: true, role: true },
      },
    },
  });

  await logAction({
    userId,
    action: isSupplement ? AuditAction.SUPPLEMENT : AuditAction.REMARK,
    entityType: entityConfig.entityType,
    entityId,
    fieldName: 'remark',
    newValue: content,
    changeSummary: `${isSupplement ? 'Supplemented' : 'Added'} remark`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Remark added to ${entityType} ${entityId} by user ${userId}`);

  return remark;
};

const getRemarks = async (entityType, entityId) => {
  const entityConfig = EntityMap[entityType];
  if (!entityConfig) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  return prisma.remark.findMany({
    where: { [entityConfig.field]: entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, username: true, role: true },
      },
    },
  });
};

const deleteRemark = async (remarkId, userId) => {
  const remark = await prisma.remark.findUnique({
    where: { id: remarkId },
  });

  if (!remark) {
    throw new NotFoundError('Remark not found');
  }

  if (remark.createdById !== userId) {
    throw new AuthorizationError('You can only delete your own remarks');
  }

  await prisma.remark.delete({
    where: { id: remarkId },
  });

  logger.info(`Remark ${remarkId} deleted by user ${userId}`);

  return { success: true };
};

module.exports = {
  addRemark,
  getRemarks,
  deleteRemark,
  EntityMap,
};
