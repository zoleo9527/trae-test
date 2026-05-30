import db from '../db';
import { Exception, PaginatedResponse } from '../types';
import { buildWhereClause, getClientIp, logAudit } from '../utils';

export interface ExceptionFilters {
  member_id?: number;
  type?: string;
  status?: string;
  created_by?: number;
  handled_by?: number;
  created_at_start?: string;
  created_at_end?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateExceptionRequest {
  member_id?: number;
  type: string;
  title: string;
  description: string;
  evidence_screenshot?: string;
  related_transaction_id?: number;
  related_booking_id?: number;
}

export interface ProcessExceptionRequest {
  status: 'processing' | 'resolved' | 'closed';
  handling_result: string;
}

export function getExceptions(filters: ExceptionFilters): PaginatedResponse<Exception & { member_name: string | null; creator_name: string; handler_name: string | null }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    'e.member_id': filters.member_id,
    'e.type': filters.type,
    'e.status': filters.status,
    'e.created_by': filters.created_by,
    'e.handled_by': filters.handled_by,
    'e.created_at_start': filters.created_at_start,
    'e.created_at_end': filters.created_at_end
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM exceptions e ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const exStmt = db.prepare(`
    SELECT e.*, m.name as member_name, uc.name as creator_name, uh.name as handler_name
    FROM exceptions e
    LEFT JOIN members m ON e.member_id = m.id
    LEFT JOIN users uc ON e.created_by = uc.id
    LEFT JOIN users uh ON e.handled_by = uh.id
    ${clause}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const items = exStmt.all(...params, pageSize, offset) as (Exception & { member_name: string | null; creator_name: string; handler_name: string | null })[];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getExceptionById(id: number): (Exception & { member_name: string | null; creator_name: string; handler_name: string | null }) | undefined {
  const stmt = db.prepare(`
    SELECT e.*, m.name as member_name, uc.name as creator_name, uh.name as handler_name
    FROM exceptions e
    LEFT JOIN members m ON e.member_id = m.id
    LEFT JOIN users uc ON e.created_by = uc.id
    LEFT JOIN users uh ON e.handled_by = uh.id
    WHERE e.id = ?
  `);
  return stmt.get(id) as (Exception & { member_name: string | null; creator_name: string; handler_name: string | null }) | undefined;
}

export interface RelatedTransaction {
  id: number;
  member_id: number;
  type: string;
  amount: number;
  principal_amount: number;
  gift_amount: number;
  source: string;
  source_id: number | null;
  remark: string | null;
  created_at: string;
  reconciliation_status: string;
  member_name: string;
}

export interface RelatedBooking {
  id: number;
  member_id: number | null;
  bay_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_amount: number;
  status: string;
  member_name: string | null;
  bay_name: string;
}

export interface ExceptionDetail extends Exception {
  member_name: string | null;
  creator_name: string;
  handler_name: string | null;
  related_transaction: RelatedTransaction | null;
  related_booking: RelatedBooking | null;
}

export function getExceptionDetailById(id: number): ExceptionDetail | undefined {
  const ex = getExceptionById(id);
  if (!ex) return undefined;

  let relatedTransaction: RelatedTransaction | null = null;
  let relatedBooking: RelatedBooking | null = null;

  if (ex.related_transaction_id) {
    const tx = db.prepare(`
      SELECT wt.*, m.name as member_name
      FROM wallet_transactions wt
      LEFT JOIN members m ON wt.member_id = m.id
      WHERE wt.id = ?
    `).get(ex.related_transaction_id) as RelatedTransaction | undefined;
    relatedTransaction = tx || null;
  }

  if (ex.related_booking_id) {
    const booking = db.prepare(`
      SELECT b.*, m.name as member_name, bay.name as bay_name
      FROM bookings b
      LEFT JOIN members m ON b.member_id = m.id
      LEFT JOIN bays bay ON b.bay_id = bay.id
      WHERE b.id = ?
    `).get(ex.related_booking_id) as RelatedBooking | undefined;
    relatedBooking = booking || null;
  }

  return {
    ...ex,
    related_transaction: relatedTransaction,
    related_booking: relatedBooking
  };
}

export function createException(req: any, operatorId: number, data: CreateExceptionRequest) {
  const tx = db.transaction(() => {
    let memberId = data.member_id;

    if (!memberId && data.related_transaction_id) {
      const txRecord = db.prepare('SELECT member_id FROM wallet_transactions WHERE id = ?').get(data.related_transaction_id) as { member_id: number } | undefined;
      if (txRecord) {
        memberId = txRecord.member_id;
      }
    }

    if (!memberId && data.related_booking_id) {
      const booking = db.prepare('SELECT member_id FROM bookings WHERE id = ?').get(data.related_booking_id) as { member_id: number } | undefined;
      if (booking) {
        memberId = booking.member_id;
      }
    }

    const insertEx = db.prepare(`
      INSERT INTO exceptions (member_id, type, title, description, evidence_screenshot, related_transaction_id, related_booking_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEx.run(
      memberId || null,
      data.type,
      data.title,
      data.description,
      data.evidence_screenshot || null,
      data.related_transaction_id || null,
      data.related_booking_id || null,
      operatorId
    );

    const exceptionId = result.lastInsertRowid as number;

    logAudit(
      operatorId,
      'exception',
      'create',
      'exception',
      exceptionId,
      null,
      data,
      getClientIp(req),
      req.headers['user-agent']
    );

    return exceptionId;
  });

  return tx();
}

export function processException(req: any, operatorId: number, exceptionId: number, data: ProcessExceptionRequest) {
  const tx = db.transaction(() => {
    const ex = getExceptionById(exceptionId);
    if (!ex) {
      throw new Error('异常工单不存在');
    }

    db.prepare(`
      UPDATE exceptions
      SET status = ?,
          handled_by = ?,
          handled_at = CURRENT_TIMESTAMP,
          handling_result = ?
      WHERE id = ?
    `).run(data.status, operatorId, data.handling_result, exceptionId);

    logAudit(
      operatorId,
      'exception',
      'process',
      'exception',
      exceptionId,
      { status: ex.status },
      { status: data.status, handling_result: data.handling_result },
      getClientIp(req),
      req.headers['user-agent']
    );

    return getExceptionById(exceptionId);
  });

  return tx();
}
