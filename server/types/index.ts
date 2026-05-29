import {
  Role,
  InquiryStatus,
  StockLockStatus,
  ReturnStatus,
  RefundStatus,
  OperationType,
  ExceptionType,
  EvidenceType,
} from './enums';

export {
  Role,
  InquiryStatus,
  StockLockStatus,
  ReturnStatus,
  RefundStatus,
  OperationType,
  ExceptionType,
  EvidenceType,
};

// ==========================================
// 状态机定义
// ==========================================

export const INQUIRY_STATUS_FLOW: Record<InquiryStatus, InquiryStatus[]> = {
  [InquiryStatus.DRAFT]:     [InquiryStatus.PENDING, InquiryStatus.CANCELLED],
  [InquiryStatus.PENDING]:   [InquiryStatus.QUOTED, InquiryStatus.CANCELLED],
  [InquiryStatus.QUOTED]:    [InquiryStatus.CONFIRMED, InquiryStatus.PENDING, InquiryStatus.CANCELLED],
  [InquiryStatus.CONFIRMED]: [InquiryStatus.COMPLETED, InquiryStatus.CANCELLED],
  [InquiryStatus.CANCELLED]: [],
  [InquiryStatus.COMPLETED]: [],
};

export const STOCK_LOCK_STATUS_FLOW: Record<StockLockStatus, StockLockStatus[]> = {
  [StockLockStatus.PENDING]:  [StockLockStatus.LOCKED, StockLockStatus.RELEASED],
  [StockLockStatus.LOCKED]:   [StockLockStatus.SOLD, StockLockStatus.RELEASED],
  [StockLockStatus.RELEASED]: [],
  [StockLockStatus.SOLD]:     [],
};

export const RETURN_STATUS_FLOW: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.PENDING_IDENTIFY]: [ReturnStatus.IDENTIFYING, ReturnStatus.REJECTED],
  [ReturnStatus.IDENTIFYING]:      [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.REWORK],
  [ReturnStatus.APPROVED]:         [ReturnStatus.COMPLETED],
  [ReturnStatus.REJECTED]:         [],
  [ReturnStatus.REWORK]:           [ReturnStatus.IDENTIFYING, ReturnStatus.REJECTED],
  [ReturnStatus.COMPLETED]:        [],
};

export const REFUND_STATUS_FLOW: Record<RefundStatus, RefundStatus[]> = {
  [RefundStatus.PENDING_REVIEW]: [RefundStatus.REVIEWING, RefundStatus.REJECTED],
  [RefundStatus.REVIEWING]:      [RefundStatus.APPROVED, RefundStatus.REJECTED],
  [RefundStatus.APPROVED]:       [RefundStatus.PAID, RefundStatus.FAILED],
  [RefundStatus.REJECTED]:       [],
  [RefundStatus.PAID]:           [RefundStatus.COMPLETED],
  [RefundStatus.FAILED]:         [RefundStatus.PAID, RefundStatus.REJECTED],
  [RefundStatus.COMPLETED]:      [],
};

// ==========================================
// 权限矩阵
// ==========================================

export const ROLE_PERMISSIONS: Record<Role, OperationType[]> = {
  [Role.STORE_OWNER]: [
    OperationType.CREATE,
    OperationType.UPDATE,
    OperationType.SUBMIT,
    OperationType.CANCEL,
    OperationType.ADD_REMARK,
    OperationType.UPLOAD_EVIDENCE,
    OperationType.EXPORT,
  ],
  [Role.SALES]: [
    OperationType.CREATE,
    OperationType.UPDATE,
    OperationType.SUBMIT,
    OperationType.APPROVE,
    OperationType.REJECT,
    OperationType.REWORK,
    OperationType.CANCEL,
    OperationType.PAY,
    OperationType.ADD_REMARK,
    OperationType.UPLOAD_EVIDENCE,
    OperationType.EXPORT,
  ],
  [Role.WAREHOUSE]: [
    OperationType.LOCK,
    OperationType.UNLOCK,
    OperationType.INSPECT,
    OperationType.ADD_REMARK,
    OperationType.UPLOAD_EVIDENCE,
    OperationType.EXPORT,
  ],
};

// 各角色允许查看的单据状态
export const ROLE_VISIBLE_STATUSES: Record<Role, {
  inquiry: InquiryStatus[];
  stockLock: StockLockStatus[];
  returnOrder: ReturnStatus[];
  refundOrder: RefundStatus[];
}> = {
  [Role.STORE_OWNER]: {
    inquiry:     Object.values(InquiryStatus),
    stockLock:   [StockLockStatus.LOCKED, StockLockStatus.SOLD, StockLockStatus.RELEASED],
    returnOrder: Object.values(ReturnStatus),
    refundOrder: Object.values(RefundStatus),
  },
  [Role.SALES]: {
    inquiry:     Object.values(InquiryStatus),
    stockLock:   Object.values(StockLockStatus),
    returnOrder: Object.values(ReturnStatus),
    refundOrder: Object.values(RefundStatus),
  },
  [Role.WAREHOUSE]: {
    inquiry:     [InquiryStatus.CONFIRMED, InquiryStatus.COMPLETED],
    stockLock:   Object.values(StockLockStatus),
    returnOrder: [ReturnStatus.PENDING_IDENTIFY, ReturnStatus.IDENTIFYING, ReturnStatus.APPROVED, ReturnStatus.COMPLETED],
    refundOrder: [],
  },
};

// ==========================================
// 状态变更操作权限
// ==========================================

export const INQUIRY_TRANSITION_PERMISSIONS: Record<string, Role[]> = {
  'DRAFT->PENDING':           [Role.STORE_OWNER, Role.SALES],
  'DRAFT->CANCELLED':         [Role.STORE_OWNER, Role.SALES],
  'PENDING->QUOTED':          [Role.SALES],
  'PENDING->CANCELLED':       [Role.STORE_OWNER, Role.SALES],
  'QUOTED->CONFIRMED':        [Role.STORE_OWNER],
  'QUOTED->PENDING':          [Role.SALES],
  'QUOTED->CANCELLED':        [Role.STORE_OWNER, Role.SALES],
  'CONFIRMED->COMPLETED':     [Role.SALES],
  'CONFIRMED->CANCELLED':     [Role.STORE_OWNER, Role.SALES],
};

export const STOCK_LOCK_TRANSITION_PERMISSIONS: Record<string, Role[]> = {
  'PENDING->LOCKED':    [Role.WAREHOUSE],
  'PENDING->RELEASED':  [Role.SALES, Role.WAREHOUSE],
  'LOCKED->SOLD':       [Role.WAREHOUSE],
  'LOCKED->RELEASED':   [Role.SALES, Role.WAREHOUSE],
};

export const RETURN_TRANSITION_PERMISSIONS: Record<string, Role[]> = {
  'PENDING_IDENTIFY->IDENTIFYING': [Role.SALES],
  'PENDING_IDENTIFY->REJECTED':    [Role.SALES],
  'IDENTIFYING->APPROVED':         [Role.SALES],
  'IDENTIFYING->REJECTED':         [Role.SALES],
  'IDENTIFYING->REWORK':           [Role.SALES],
  'APPROVED->COMPLETED':           [Role.SALES],
  'REWORK->IDENTIFYING':           [Role.STORE_OWNER, Role.SALES],
  'REWORK->REJECTED':              [Role.SALES],
};

export const REFUND_TRANSITION_PERMISSIONS: Record<string, Role[]> = {
  'PENDING_REVIEW->REVIEWING': [Role.SALES],
  'PENDING_REVIEW->REJECTED':  [Role.SALES],
  'REVIEWING->APPROVED':       [Role.SALES],
  'REVIEWING->REJECTED':       [Role.SALES],
  'APPROVED->PAID':            [Role.SALES],
  'APPROVED->FAILED':          [Role.SALES],
  'PAID->COMPLETED':           [Role.SALES],
  'FAILED->PAID':              [Role.SALES],
  'FAILED->REJECTED':          [Role.SALES],
};

// ==========================================
// 字段级权限
// ==========================================

export const FIELD_PERMISSIONS: Record<string, Record<string, Role[]>> = {
  inquiry: {
    customerName:  [Role.STORE_OWNER, Role.SALES],
    customerPhone: [Role.STORE_OWNER, Role.SALES],
    carModel:      [Role.STORE_OWNER, Role.SALES],
    vinNo:         [Role.STORE_OWNER, Role.SALES],
    totalAmount:   [Role.SALES],
    items:         [Role.STORE_OWNER, Role.SALES],
    rejectReason:  [Role.SALES],
    hasException:  [Role.SALES],
    exceptionType: [Role.SALES],
    exceptionNote: [Role.SALES],
  },
  returnOrder: {
    returnReason:      [Role.STORE_OWNER],
    applyRefundAmount: [Role.STORE_OWNER],
    identifyResult:    [Role.SALES],
    rejectReason:      [Role.SALES],
    reworkNote:        [Role.SALES],
    supplementNote:    [Role.STORE_OWNER, Role.SALES],
    hasException:      [Role.SALES],
    exceptionType:     [Role.SALES],
    exceptionNote:     [Role.SALES],
  },
  stockLock: {
    warehouseNote: [Role.WAREHOUSE],
    validUntil:    [Role.SALES, Role.WAREHOUSE],
    items:         [Role.WAREHOUSE],
    rejectReason:  [Role.WAREHOUSE],
  },
  refundOrder: {
    refundAmount:       [Role.SALES],
    actualRefundAmount: [Role.SALES],
    paymentMethod:      [Role.SALES],
    paymentTraceNo:     [Role.SALES],
    reviewResult:       [Role.SALES],
    rejectReason:       [Role.SALES],
    isCreditCustomer:   [Role.SALES],
    dueDate:            [Role.SALES],
    hasDelay:           [Role.SALES],
    delayDays:          [Role.SALES],
    hasException:       [Role.SALES],
    exceptionType:      [Role.SALES],
    exceptionNote:      [Role.SALES],
  },
};

// ==========================================
// API 响应格式定义
// ==========================================

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  requestId?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface QueryFilter {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  status?: string[];
  startDate?: string;
  endDate?: string;
  hasException?: boolean;
}

// ==========================================
// JWT 类型定义
// ==========================================

export interface JwtPayload {
  userId: string;
  username: string;
  realName: string;
  role: Role;
}

// ==========================================
// 业务错误码
// ==========================================

export const ErrorCodes = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  VALIDATION_ERROR: 40001,
  UNAUTHORIZED: 40100,
  INVALID_TOKEN: 40101,
  FORBIDDEN: 40300,
  PERMISSION_DENIED: 40301,
  INVALID_STATE_TRANSITION: 40302,
  NOT_FOUND: 40400,
  DUPLICATE_ERROR: 40900,
  IDEMPOTENT_DUPLICATE: 40901,
  BUSINESS_ERROR: 50000,
  DATABASE_ERROR: 50001,
  EXTERNAL_SERVICE_ERROR: 50002,
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export class BusinessError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// 状态标签映射
// ==========================================

export {
  RoleLabel,
  InquiryStatusLabel,
  StockLockStatusLabel,
  ReturnStatusLabel,
  RefundStatusLabel,
  ExceptionTypeLabel,
  EvidenceTypeLabel,
} from './enums';

// ==========================================
// 工具函数
// ==========================================

export function calculatePagination(total: number, page: number, pageSize: number): Pagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==========================================
// 类型别名
// ==========================================

import { Inquiry as PrismaInquiry } from '@prisma/client';
export type Inquiry = PrismaInquiry;
