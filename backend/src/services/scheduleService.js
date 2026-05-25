const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { NotFoundError, BusinessError, ConflictError } = require('../utils/errors');
const { logAction, logChanges, AuditAction, EntityType } = require('./auditService');

const ScheduleStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PERFORMING: 'PERFORMING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
};

const StatusTransitionRules = {
  [ScheduleStatus.DRAFT]: [ScheduleStatus.CONFIRMED, ScheduleStatus.CANCELLED],
  [ScheduleStatus.CONFIRMED]: [ScheduleStatus.PERFORMING, ScheduleStatus.CANCELLED, ScheduleStatus.RESCHEDULED],
  [ScheduleStatus.PERFORMING]: [ScheduleStatus.COMPLETED, ScheduleStatus.CANCELLED],
  [ScheduleStatus.COMPLETED]: [],
  [ScheduleStatus.CANCELLED]: [],
  [ScheduleStatus.RESCHEDULED]: [ScheduleStatus.CONFIRMED, ScheduleStatus.CANCELLED],
};

const checkTimeConflict = async (startTime, endTime, venue, excludeId = null) => {
  const where = {
    venue,
    status: { in: [ScheduleStatus.CONFIRMED, ScheduleStatus.PERFORMING] },
    AND: [
      { startTime: { lt: new Date(endTime) } },
      { endTime: { gt: new Date(startTime) } },
    ],
  };

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  const conflicts = await prisma.schedule.findMany({
    where,
    select: {
      id: true,
      performanceName: true,
      startTime: true,
      endTime: true,
    },
  });

  return conflicts;
};

const validateStatusTransition = (oldStatus, newStatus) => {
  const allowedTransitions = StatusTransitionRules[oldStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BusinessError(
      `Cannot transition from ${oldStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
};

const createSchedule = async (data, userId, { ipAddress, userAgent, requestId }) => {
  const conflicts = await checkTimeConflict(data.startTime, data.endTime, data.venue);
  if (conflicts.length > 0) {
    throw new ConflictError('Time conflict detected with existing schedules', {
      conflicts: conflicts.map(c => ({
        id: c.id,
        name: c.performanceName,
        time: `${c.startTime} - ${c.endTime}`,
      })),
    });
  }

  const schedule = await prisma.schedule.create({
    data: {
      ...data,
      createdById: userId,
      updatedById: userId,
    },
    include: {
      createdBy: { select: { id: true, name: true, username: true, role: true } },
      updatedBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  await logAction({
    userId,
    action: AuditAction.CREATE,
    entityType: EntityType.SCHEDULE,
    entityId: schedule.id,
    newValue: data,
    changeSummary: `Created schedule: ${data.performanceName}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Schedule ${schedule.id} created by user ${userId}`);

  return schedule;
};

const getScheduleById = async (id) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, username: true, role: true } },
      updatedBy: { select: { id: true, name: true, username: true, role: true } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: { changedBy: { select: { id: true, name: true, role: true } } },
      },
      remarks: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      },
      equipmentBorrows: {
        include: {
          equipment: true,
          requestedBy: { select: { id: true, name: true, role: true } },
          approvedBy: { select: { id: true, name: true, role: true } },
        },
      },
      reviews: {
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          reviewIssues: true,
        },
      },
      groupOrders: true,
    },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  return schedule;
};

const getSchedules = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.venue) where.venue = { contains: filters.venue };
  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    if (filters.startDate) where.startTime.gte = new Date(filters.startDate);
    if (filters.endDate) where.startTime.lte = new Date(filters.endDate);
  }

  const [schedules, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { startTime: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.schedule.count({ where }),
  ]);

  return { schedules, total };
};

const updateSchedule = async (id, data, userId, { ipAddress, userAgent, requestId }) => {
  const oldSchedule = await prisma.schedule.findUnique({ where: { id } });
  if (!oldSchedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (data.startTime || data.endTime || data.venue) {
    const conflicts = await checkTimeConflict(
      data.startTime || oldSchedule.startTime,
      data.endTime || oldSchedule.endTime,
      data.venue || oldSchedule.venue,
      id
    );
    if (conflicts.length > 0) {
      throw new ConflictError('Time conflict detected with existing schedules', {
        conflicts: conflicts.map(c => ({
          id: c.id,
          name: c.performanceName,
          time: `${c.startTime} - ${c.endTime}`,
        })),
      });
    }
  }

  const updatedData = { ...data, updatedById: userId };

  const schedule = await prisma.schedule.update({
    where: { id },
    data: updatedData,
    include: {
      createdBy: { select: { id: true, name: true, username: true, role: true } },
      updatedBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  const fieldsToTrack = ['performanceName', 'performanceType', 'startTime', 'endTime', 'venue', 'castList', 'description'];
  await logChanges({
    userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.SCHEDULE,
    entityId: id,
    oldData: oldSchedule,
    newData: updatedData,
    fields: fieldsToTrack,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Schedule ${id} updated by user ${userId}`);

  return schedule;
};

const changeStatus = async (id, newStatus, changeReason, userId, { ipAddress, userAgent, requestId }) => {
  const oldSchedule = await prisma.schedule.findUnique({ where: { id } });
  if (!oldSchedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (oldSchedule.status === newStatus) {
    return oldSchedule;
  }

  validateStatusTransition(oldSchedule.status, newStatus);

  const result = await prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.update({
      where: { id },
      data: {
        status: newStatus,
        updatedById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true, role: true } },
        updatedBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    await tx.scheduleStatusHistory.create({
      data: {
        scheduleId: id,
        oldStatus: oldSchedule.status,
        newStatus,
        changedById: userId,
        changeReason,
      },
    });

    return schedule;
  });

  await logAction({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.SCHEDULE,
    entityId: id,
    fieldName: 'status',
    oldValue: oldSchedule.status,
    newValue: newStatus,
    changeSummary: `Status changed: ${oldSchedule.status} → ${newStatus}. Reason: ${changeReason || 'N/A'}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Schedule ${id} status changed from ${oldSchedule.status} to ${newStatus} by user ${userId}`);

  return result;
};

const deleteSchedule = async (id, userId, { ipAddress, userAgent, requestId }) => {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (schedule.status !== ScheduleStatus.DRAFT) {
    throw new BusinessError('Only draft schedules can be deleted', 'CANNOT_DELETE_NON_DRAFT');
  }

  await prisma.schedule.delete({ where: { id } });

  await logAction({
    userId,
    action: AuditAction.DELETE,
    entityType: EntityType.SCHEDULE,
    entityId: id,
    oldValue: schedule,
    changeSummary: `Deleted schedule: ${schedule.performanceName}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Schedule ${id} deleted by user ${userId}`);

  return { success: true };
};

const getStatusHistory = async (scheduleId) => {
  const history = await prisma.scheduleStatusHistory.findMany({
    where: { scheduleId },
    orderBy: { createdAt: 'asc' },
    include: {
      changedBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  return history;
};

module.exports = {
  ScheduleStatus,
  StatusTransitionRules,
  createSchedule,
  getScheduleById,
  getSchedules,
  updateSchedule,
  changeStatus,
  deleteSchedule,
  getStatusHistory,
  checkTimeConflict,
  validateStatusTransition,
};
