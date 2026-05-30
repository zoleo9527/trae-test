import db from '../db';
import { AuditLog, PaginatedResponse } from '../types';
import { buildWhereClause } from '../utils';

export interface AuditLogFilters {
  user_id?: number;
  module?: string;
  action?: string;
  target_type?: string;
  created_at_start?: string;
  created_at_end?: string;
  page?: number;
  pageSize?: number;
}

export function getAuditLogs(filters: AuditLogFilters): PaginatedResponse<AuditLog> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    user_id: filters.user_id,
    module: filters.module,
    action: filters.action,
    target_type: filters.target_type,
    created_at_start: filters.created_at_start,
    created_at_end: filters.created_at_end
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const logsStmt = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${clause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const items = logsStmt.all(...params, pageSize, offset) as (AuditLog & { user_name: string })[];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getAuditLogById(id: number): (AuditLog & { user_name: string }) | undefined {
  const stmt = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `);
  return stmt.get(id) as (AuditLog & { user_name: string }) | undefined;
}
