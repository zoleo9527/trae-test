const yup = require('yup');

const IssueStatus = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const createReviewSchema = yup.object({
  scheduleId: yup.string().uuid('Invalid schedule ID').required('Schedule ID is required'),
  reviewContent: yup.string().required('Review content is required'),
  overallRating: yup.number().integer().min(1).max(5).nullable(),
  issuesFound: yup.string().nullable(),
  improvementSuggestions: yup.string().nullable(),
});

const updateReviewSchema = yup.object({
  reviewContent: yup.string(),
  overallRating: yup.number().integer().min(1).max(5).nullable(),
  issuesFound: yup.string().nullable(),
  improvementSuggestions: yup.string().nullable(),
});

const createIssueSchema = yup.object({
  reviewId: yup.string().uuid('Invalid review ID').required('Review ID is required'),
  title: yup.string().required('Issue title is required').max(200),
  description: yup.string().required('Issue description is required'),
  severity: yup.string().oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'Invalid severity').required('Severity is required'),
  responsibleParty: yup.string().nullable().max(200),
});

const updateIssueSchema = yup.object({
  title: yup.string().max(200),
  description: yup.string(),
  severity: yup.string().oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'Invalid severity'),
  status: yup.string().oneOf(IssueStatus, 'Invalid status'),
  responsibleParty: yup.string().nullable().max(200),
  resolution: yup.string().nullable(),
});

const reviewFilterSchema = yup.object({
  scheduleId: yup.string().uuid().nullable(),
  createdById: yup.string().uuid().nullable(),
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

const issueFilterSchema = yup.object({
  reviewId: yup.string().uuid().nullable(),
  status: yup.string().oneOf(IssueStatus).nullable(),
  severity: yup.string().oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable(),
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  createIssueSchema,
  updateIssueSchema,
  reviewFilterSchema,
  issueFilterSchema,
};
