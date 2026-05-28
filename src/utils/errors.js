class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors) {
    super(message || '数据验证失败', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message || '身份验证失败', 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message || '权限不足，无法执行此操作', 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || '资源不存在', 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || '状态冲突，操作无法执行', 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message || '请求过于频繁，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class IdempotencyError extends AppError {
  constructor(message) {
    super(message || '幂等校验失败', 409, 'IDEMPOTENCY_ERROR');
  }
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  IdempotencyError,
};
