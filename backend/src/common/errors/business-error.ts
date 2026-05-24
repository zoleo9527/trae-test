export enum ErrorCode {
  STUDENT_NOT_FOUND = 'STUDENT_NOT_FOUND',
  WORK_ORDER_NOT_FOUND = 'WORK_ORDER_NOT_FOUND',
  REFUND_NOT_FOUND = 'REFUND_NOT_FOUND',
  TRANSFER_NOT_FOUND = 'TRANSFER_NOT_FOUND',
  MATERIAL_NOT_FOUND = 'MATERIAL_NOT_FOUND',
  AUDIT_LOG_NOT_FOUND = 'AUDIT_LOG_NOT_FOUND',

  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  INVALID_ROLE = 'INVALID_ROLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',

  MATERIAL_VERSION_CONFLICT = 'MATERIAL_VERSION_CONFLICT',
  DEADLINE_MISSED = 'DEADLINE_MISSED',
  INSUFFICIENT_CONTEXT = 'INSUFFICIENT_CONTEXT',

  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class BusinessError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'BusinessError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export const createError = (code: ErrorCode, message: string, details?: Record<string, any>) => {
  return new BusinessError(code, message, details);
};
