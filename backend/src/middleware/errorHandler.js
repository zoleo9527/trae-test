const logger = require('../config/logger');
const { error } = require('../utils/response');
const { AppError, ValidationError } = require('../utils/errors');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;
  let code = err.code || 'INTERNAL_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }

  if (err instanceof ValidationError) {
    errors = err.errors;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      statusCode = 409;
      message = `Duplicate value for ${field}`;
      code = 'DUPLICATE_ENTRY';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Related record not found';
      code = 'FOREIGN_KEY_ERROR';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      code = 'NOT_FOUND';
    }
  }

  if (err.name === 'YupValidationError' || err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    if (err.inner) {
      errors = err.inner.map(e => ({
        field: e.path,
        message: e.message,
      }));
    }
  }

  if (statusCode === 500) {
    logger.error('Unhandled error:', {
      message: err.message,
      stack: err.stack,
      requestId: req.requestId,
      url: req.url,
      method: req.method,
    });
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal Server Error';
    }
  }

  return error(res, message, statusCode, {
    code,
    errors,
    requestId: req.requestId,
  });
};
