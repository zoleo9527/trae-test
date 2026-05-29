import { Request } from 'express';

export const Role = {
  PROJECT_COORDINATOR: 'PROJECT_COORDINATOR',
  SITE_EXECUTIVE: 'SITE_EXECUTIVE',
  SUPPLIER_CONTACT: 'SUPPLIER_CONTACT',
  FINANCE: 'FINANCE',
  ADMIN: 'ADMIN',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const ProjectStatus = {
  PLANNING: 'PLANNING',
  PREPARATION: 'PREPARATION',
  ON_SITE: 'ON_SITE',
  TEARDOWN: 'TEARDOWN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ReconciliationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVIEWING: 'REVIEWING',
  REVISED: 'REVISED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const;

export type ReconciliationStatus = typeof ReconciliationStatus[keyof typeof ReconciliationStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const DocumentType = {
  ENTRY_PERMIT: 'ENTRY_PERMIT',
  CONSTRUCTION_PERMIT: 'CONSTRUCTION_PERMIT',
  INSURANCE: 'INSURANCE',
  OTHER: 'OTHER',
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export const DocumentStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];

export const TeardownStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  MATERIALS_RETURNED: 'MATERIALS_RETURNED',
  SITE_CLEARED: 'SITE_CLEARED',
  COMPLETED: 'COMPLETED',
} as const;

export type TeardownStatus = typeof TeardownStatus[keyof typeof TeardownStatus];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  COMPLETE: 'COMPLETE',
  CANCEL: 'CANCEL',
  REVISE: 'REVISE',
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  idempotencyKey?: string;
}

export interface AuditLogData {
  action: AuditAction;
  entityType: string;
  entityId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  remark?: string;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
