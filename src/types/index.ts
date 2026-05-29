import { Request } from 'express';

export type Role = 'BASE_MANAGER' | 'MAINTENANCE_WORKER' | 'SALES_COORDINATOR';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'APPROVE' | 'REJECT' | 'SUBMIT' | 'LOGIN' | 'LOGOUT';
export type TodoType = 'HARVEST_APPROVAL' | 'MAINTENANCE_REVIEW' | 'DISEASE_FOLLOWUP' | 'VISIT_FOLLOWUP' | 'NEGOTIATION_REVIEW' | 'RESEED_IMPLEMENTATION' | 'CUSTOMER_CONFIRMATION';
export type HarvestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type MaintenanceType = 'WATERING' | 'FERTILIZING' | 'PEST_CONTROL' | 'PRUNING' | 'DISEASE_TREATMENT' | 'OTHER';
export type DiseaseSeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type VisitResult = 'SATISFIED' | 'PARTIALLY_SATISFIED' | 'DISSATISFIED' | 'NEEDS_FOLLOWUP';
export type NegotiationStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REWORK_REQUIRED' | 'IMPLEMENTING' | 'COMPLETED' | 'CUSTOMER_CONFIRMED';

export const ROLE: Record<string, Role> = {
  BASE_MANAGER: 'BASE_MANAGER',
  MAINTENANCE_WORKER: 'MAINTENANCE_WORKER',
  SALES_COORDINATOR: 'SALES_COORDINATOR',
};

export const AUDIT_ACTION: Record<string, AuditAction> = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SUBMIT: 'SUBMIT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

export const TODO_TYPE: Record<string, TodoType> = {
  HARVEST_APPROVAL: 'HARVEST_APPROVAL',
  MAINTENANCE_REVIEW: 'MAINTENANCE_REVIEW',
  DISEASE_FOLLOWUP: 'DISEASE_FOLLOWUP',
  VISIT_FOLLOWUP: 'VISIT_FOLLOWUP',
  NEGOTIATION_REVIEW: 'NEGOTIATION_REVIEW',
  RESEED_IMPLEMENTATION: 'RESEED_IMPLEMENTATION',
  CUSTOMER_CONFIRMATION: 'CUSTOMER_CONFIRMATION',
};

export const HARVEST_STATUS: Record<string, HarvestStatus> = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

export const MAINTENANCE_TYPE: Record<string, MaintenanceType> = {
  WATERING: 'WATERING',
  FERTILIZING: 'FERTILIZING',
  PEST_CONTROL: 'PEST_CONTROL',
  PRUNING: 'PRUNING',
  DISEASE_TREATMENT: 'DISEASE_TREATMENT',
  OTHER: 'OTHER',
};

export const DISEASE_SEVERITY: Record<string, DiseaseSeverity> = {
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
  CRITICAL: 'CRITICAL',
};

export const VISIT_RESULT: Record<string, VisitResult> = {
  SATISFIED: 'SATISFIED',
  PARTIALLY_SATISFIED: 'PARTIALLY_SATISFIED',
  DISSATISFIED: 'DISSATISFIED',
  NEEDS_FOLLOWUP: 'NEEDS_FOLLOWUP',
};

export const NEGOTIATION_STATUS: Record<string, NegotiationStatus> = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  MANAGER_REVIEW: 'MANAGER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REWORK_REQUIRED: 'REWORK_REQUIRED',
  IMPLEMENTING: 'IMPLEMENTING',
  COMPLETED: 'COMPLETED',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
};

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  idempotencyKey?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  changeSummary?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TodoCreateData {
  type: TodoType;
  title: string;
  description?: string;
  referenceId: string;
  referenceType: string;
  assigneeId: string;
  creatorId: string;
  dueDate?: Date;
  priority?: number;
}

export type RoleHierarchy = Record<Role, Role[]>;

export const ROLE_HIERARCHY: RoleHierarchy = {
  BASE_MANAGER: ['BASE_MANAGER', 'MAINTENANCE_WORKER', 'SALES_COORDINATOR'],
  MAINTENANCE_WORKER: ['MAINTENANCE_WORKER'],
  SALES_COORDINATOR: ['SALES_COORDINATOR'],
};
