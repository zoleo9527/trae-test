class AppError extends Error {
  constructor(code, message, details) {
    super(message)
    this.code = code
    this.details = details || null
    this.isOperational = true
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message || '参数校验失败', details)
    this.statusCode = 400
  }
}

class PermissionError extends AppError {
  constructor(message) {
    super('PERMISSION_DENIED', message || '权限不足', null)
    this.statusCode = 403
  }
}

class AuthError extends AppError {
  constructor(message) {
    super('AUTH_ERROR', message || '认证失败', null)
    this.statusCode = 401
  }
}

class StateConflictError extends AppError {
  constructor(message, details) {
    super('STATE_CONFLICT', message || '状态冲突', details)
    this.statusCode = 409
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super('NOT_FOUND', message || '资源不存在', null)
    this.statusCode = 404
  }
}

class LensAllocationError extends AppError {
  constructor(message, details) {
    super('LENS_ALLOCATION_ERROR', message || '镜片调拨异常', details)
    this.statusCode = 422
  }
}

class StockError extends AppError {
  constructor(message, details) {
    super('STOCK_ERROR', message || '库存异常', details)
    this.statusCode = 422
  }
}

module.exports = {
  AppError,
  ValidationError,
  PermissionError,
  AuthError,
  StateConflictError,
  NotFoundError,
  LensAllocationError,
  StockError
}
