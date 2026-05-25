const reviewService = require('../services/reviewService');
const { success, paginated } = require('../utils/response');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, review, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);
    success(res, review);
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { page, pageSize, scheduleId, createdById } = req.query;

    const filters = { scheduleId, createdById };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { reviews, total } = await reviewService.getReviews(filters, pagination);

    paginated(res, reviews, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.updateReview(id, req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, review, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
};

const createIssue = async (req, res, next) => {
  try {
    const issue = await reviewService.createIssue(req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, issue, 'Issue created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = await reviewService.getIssueById(id);
    success(res, issue);
  } catch (error) {
    next(error);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const { page, pageSize, reviewId, status, severity } = req.query;

    const filters = { reviewId, status, severity };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { issues, total } = await reviewService.getIssues(filters, pagination);

    paginated(res, issues, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = await reviewService.updateIssue(id, req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, issue, 'Issue updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReview,
  getReviews,
  updateReview,
  createIssue,
  getIssue,
  getIssues,
  updateIssue,
};
