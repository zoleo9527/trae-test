const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { NotFoundError, BusinessError } = require('../utils/errors');
const { logAction, logChanges, AuditAction, EntityType } = require('./auditService');
const { ScheduleStatus } = require('./scheduleService');

const IssueStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

const createReview = async (data, userId, { ipAddress, userAgent, requestId }) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: data.scheduleId },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (![ScheduleStatus.COMPLETED, ScheduleStatus.PERFORMING].includes(schedule.status)) {
    throw new BusinessError(
      'Can only create review for PERFORMING or COMPLETED schedules',
      'INVALID_SCHEDULE_STATUS'
    );
  }

  const existingReview = await prisma.performanceReview.findFirst({
    where: { scheduleId: data.scheduleId },
  });

  if (existingReview) {
    throw new BusinessError('A review already exists for this schedule', 'REVIEW_EXISTS');
  }

  const review = await prisma.performanceReview.create({
    data: {
      ...data,
      createdById: userId,
    },
    include: {
      schedule: { select: { id: true, performanceName: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  await logAction({
    userId,
    action: AuditAction.CREATE,
    entityType: EntityType.PERFORMANCE_REVIEW,
    entityId: review.id,
    newValue: data,
    changeSummary: `Created review for schedule: ${schedule.performanceName}`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Review ${review.id} created by user ${userId}`);

  return review;
};

const getReviewById = async (id) => {
  const review = await prisma.performanceReview.findUnique({
    where: { id },
    include: {
      schedule: { select: { id: true, performanceName: true, startTime: true, venue: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } },
      reviewIssues: {
        orderBy: { createdAt: 'desc' },
        include: {
          remarks: {
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { id: true, name: true, role: true } } },
          },
        },
      },
      remarks: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  return review;
};

const getReviews = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.scheduleId) where.scheduleId = filters.scheduleId;
  if (filters.createdById) where.createdById = filters.createdById;

  const [reviews, total] = await Promise.all([
    prisma.performanceReview.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        schedule: { select: { id: true, performanceName: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { reviewIssues: true } },
      },
    }),
    prisma.performanceReview.count({ where }),
  ]);

  return { reviews, total };
};

const updateReview = async (id, data, userId, { ipAddress, userAgent, requestId }) => {
  const oldReview = await prisma.performanceReview.findUnique({ where: { id } });
  if (!oldReview) {
    throw new NotFoundError('Review not found');
  }

  const review = await prisma.performanceReview.update({
    where: { id },
    data,
    include: {
      schedule: { select: { id: true, performanceName: true } },
      createdBy: { select: { id: true, name: true, username: true, role: true } },
    },
  });

  const fieldsToTrack = ['reviewContent', 'overallRating', 'issuesFound', 'improvementSuggestions'];
  await logChanges({
    userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.PERFORMANCE_REVIEW,
    entityId: id,
    oldData: oldReview,
    newData: data,
    fields: fieldsToTrack,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Review ${id} updated by user ${userId}`);

  return review;
};

const createIssue = async (data, userId, { ipAddress, userAgent, requestId }) => {
  const review = await prisma.performanceReview.findUnique({
    where: { id: data.reviewId },
    include: { schedule: true },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  const issue = await prisma.reviewIssue.create({
    data: {
      ...data,
      status: IssueStatus.OPEN,
    },
    include: {
      review: { select: { id: true, schedule: { select: { performanceName: true } } } },
    },
  });

  await logAction({
    userId,
    action: AuditAction.CREATE,
    entityType: EntityType.REVIEW_ISSUE,
    entityId: issue.id,
    newValue: data,
    changeSummary: `Created issue: ${data.title} (${data.severity})`,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Issue ${issue.id} created by user ${userId}`);

  return issue;
};

const getIssueById = async (id) => {
  const issue = await prisma.reviewIssue.findUnique({
    where: { id },
    include: {
      review: { select: { id: true, schedule: { select: { id: true, performanceName: true } } } },
      remarks: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!issue) {
    throw new NotFoundError('Issue not found');
  }

  return issue;
};

const getIssues = async (filters = {}, pagination = { page: 1, pageSize: 20 }) => {
  const { page, pageSize } = pagination;
  const skip = (page - 1) * pageSize;

  const where = {};
  if (filters.reviewId) where.reviewId = filters.reviewId;
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;

  const [issues, total] = await Promise.all([
    prisma.reviewIssue.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        review: { select: { id: true, schedule: { select: { performanceName: true } } } },
      },
    }),
    prisma.reviewIssue.count({ where }),
  ]);

  return { issues, total };
};

const updateIssue = async (id, data, userId, { ipAddress, userAgent, requestId }) => {
  const oldIssue = await prisma.reviewIssue.findUnique({ where: { id } });
  if (!oldIssue) {
    throw new NotFoundError('Issue not found');
  }

  if (data.status && data.status === IssueStatus.RESOLVED && !oldIssue.resolvedAt) {
    data.resolvedAt = new Date();
  }

  const issue = await prisma.reviewIssue.update({
    where: { id },
    data,
    include: {
      review: { select: { id: true, schedule: { select: { performanceName: true } } } },
    },
  });

  const fieldsToTrack = ['title', 'description', 'severity', 'status', 'responsibleParty', 'resolution'];
  await logChanges({
    userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.REVIEW_ISSUE,
    entityId: id,
    oldData: oldIssue,
    newData: data,
    fields: fieldsToTrack,
    ipAddress,
    userAgent,
    requestId,
  });

  logger.info(`Issue ${id} updated by user ${userId}`);

  return issue;
};

module.exports = {
  IssueStatus,
  createReview,
  getReviewById,
  getReviews,
  updateReview,
  createIssue,
  getIssueById,
  getIssues,
  updateIssue,
};
