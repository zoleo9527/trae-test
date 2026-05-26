export const Role = {
  SALES_CONSULTANT: 'SALES_CONSULTANT',
  SHOWROOM_MANAGER: 'SHOWROOM_MANAGER',
  INSTALL_COORDINATOR: 'INSTALL_COORDINATOR',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const BorrowStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  BORROWED: 'BORROWED',
  RETURNING: 'RETURNING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type BorrowStatus = typeof BorrowStatus[keyof typeof BorrowStatus];

export const ReturnStatus = {
  PENDING_INSPECTION: 'PENDING_INSPECTION',
  INSPECTION_PASSED: 'INSPECTION_PASSED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  COMPLETED: 'COMPLETED',
} as const;

export type ReturnStatus = typeof ReturnStatus[keyof typeof ReturnStatus];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  BORROW: 'BORROW',
  RETURN: 'RETURN',
  INSPECT: 'INSPECT',
  REASSIGN: 'REASSIGN',
  COMMENT: 'COMMENT',
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
