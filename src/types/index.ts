import { Request } from 'express';

export const Role = {
  PROJECT_COORDINATOR: 'PROJECT_COORDINATOR',
  SITE_EXECUTIVE: 'SITE_EXECUTIVE',
  SUPPLIER_CONTACT: 'SUPPLIER_CONTACT',
  FINANCE: 'FINANCE',
  ADMIN: 'ADMIN',
} as const;

export type Role = typeof Role[keyof typeof Role];

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
