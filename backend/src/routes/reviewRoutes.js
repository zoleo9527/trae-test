const express = require('express');
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/authorize');
const { Permissions } = require('../utils/permissions');
const {
  createReviewSchema,
  updateReviewSchema,
  createIssueSchema,
  updateIssueSchema,
  reviewFilterSchema,
  issueFilterSchema,
} = require('../validators/reviewValidators');
const { idParamSchema } = require('../validators/commonValidators');

const router = express.Router();

router.get(
  '/',
  auth,
  requirePermission(Permissions.REVIEW_VIEW),
  validate(reviewFilterSchema, 'query'),
  reviewController.getReviews
);

router.post(
  '/',
  auth,
  requirePermission(Permissions.REVIEW_CREATE),
  validate(createReviewSchema),
  reviewController.createReview
);

router.get(
  '/:id',
  auth,
  requirePermission(Permissions.REVIEW_VIEW),
  validate(idParamSchema, 'params'),
  reviewController.getReview
);

router.put(
  '/:id',
  auth,
  requirePermission(Permissions.REVIEW_CREATE),
  validate(idParamSchema, 'params'),
  validate(updateReviewSchema),
  reviewController.updateReview
);

router.get(
  '/issues',
  auth,
  requirePermission(Permissions.REVIEW_VIEW),
  validate(issueFilterSchema, 'query'),
  reviewController.getIssues
);

router.post(
  '/issues',
  auth,
  requirePermission(Permissions.REVIEW_ISSUE_MANAGE),
  validate(createIssueSchema),
  reviewController.createIssue
);

router.get(
  '/issues/:id',
  auth,
  requirePermission(Permissions.REVIEW_VIEW),
  validate(idParamSchema, 'params'),
  reviewController.getIssue
);

router.put(
  '/issues/:id',
  auth,
  requirePermission(Permissions.REVIEW_ISSUE_MANAGE),
  validate(idParamSchema, 'params'),
  validate(updateIssueSchema),
  reviewController.updateIssue
);

module.exports = router;
