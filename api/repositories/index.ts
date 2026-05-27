import db from '../db/index.js';
import type {
  CollectionRow,
  OrderRow,
  OrderStatus,
  RescheduleRow,
  RetouchRow,
  Role,
  TimelineEventRow,
} from '../types.js';

export function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const orderRepo = {
  list(filters?: { status?: string; keyword?: string; from?: string; to?: string }) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];
    if (filters?.status && filters.status !== 'all') {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.keyword) {
      sql += ' AND (customer_name LIKE ? OR order_no LIKE ?)';
      const kw = `%${filters.keyword}%`;
      params.push(kw, kw);
    }
    if (filters?.from) {
      sql += ' AND shoot_date >= ?';
      params.push(filters.from);
    }
    if (filters?.to) {
      sql += ' AND shoot_date <= ?';
      params.push(filters.to);
    }
    sql += ' ORDER BY shoot_date DESC';
    return db.prepare(sql).all(...params) as OrderRow[];
  },

  findById(id: string) {
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
  },

  update(id: string, patch: Partial<OrderRow>) {
    const keys = Object.keys(patch).filter(k => k !== 'id');
    if (keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (patch as any)[k]);
    db.prepare(`UPDATE orders SET ${sets}, updated_at = ? WHERE id = ?`).run(
      ...values,
      new Date().toISOString(),
      id,
    );
  },
};

export const timelineRepo = {
  listByOrder(orderId: string) {
    return db
      .prepare('SELECT * FROM timeline_events WHERE order_id = ? ORDER BY at DESC')
      .all(orderId) as TimelineEventRow[];
  },

  insert(row: Omit<TimelineEventRow, 'id'>) {
    const id = genId('evt');
    db.prepare(
      'INSERT INTO timeline_events (id, order_id, type, actor_role, actor_name, at, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(
      id,
      row.order_id,
      row.type,
      row.actor_role,
      row.actor_name,
      row.at,
      row.payload,
    );
    return id;
  },
};

export const rescheduleRepo = {
  listByOrder(orderId: string) {
    return db
      .prepare('SELECT * FROM reschedule_requests WHERE order_id = ? ORDER BY created_at DESC')
      .all(orderId) as RescheduleRow[];
  },

  findById(id: string) {
    return db.prepare('SELECT * FROM reschedule_requests WHERE id = ?').get(id) as
      | RescheduleRow
      | undefined;
  },

  insert(row: Omit<RescheduleRow, 'id'>) {
    const id = genId('rs');
    db.prepare(
      `INSERT INTO reschedule_requests (id, order_id, suggested_from, suggested_to, reason, status, approver_role, approver_name, approved_at, reject_reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      row.order_id,
      row.suggested_from,
      row.suggested_to,
      row.reason,
      row.status,
      row.approver_role ?? null,
      row.approver_name ?? null,
      row.approved_at ?? null,
      row.reject_reason ?? null,
      row.created_at,
    );
    return id;
  },

  update(id: string, patch: Partial<RescheduleRow>) {
    const keys = Object.keys(patch).filter(k => k !== 'id');
    if (keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (patch as any)[k]);
    db.prepare(`UPDATE reschedule_requests SET ${sets} WHERE id = ?`).run(...values, id);
  },
};

export const collectionRepo = {
  listByOrder(orderId: string) {
    return db
      .prepare('SELECT * FROM collection_records WHERE order_id = ? ORDER BY created_at DESC')
      .all(orderId) as CollectionRow[];
  },

  insert(row: Omit<CollectionRow, 'id'>) {
    const id = genId('cl');
    db.prepare(
      `INSERT INTO collection_records (id, order_id, method, result, remark, actor_role, actor_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      row.order_id,
      row.method,
      row.result,
      row.remark ?? null,
      row.actor_role,
      row.actor_name,
      row.created_at,
    );
    return id;
  },

  findById(id: string) {
    return db.prepare('SELECT * FROM collection_records WHERE id = ?').get(id) as
      | CollectionRow
      | undefined;
  },

  update(id: string, patch: Partial<CollectionRow>) {
    const keys = Object.keys(patch).filter(k => k !== 'id');
    if (keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (patch as any)[k]);
    db.prepare(`UPDATE collection_records SET ${sets} WHERE id = ?`).run(...values, id);
  },
};

export const retouchRepo = {
  listByOrder(orderId: string) {
    return db
      .prepare('SELECT * FROM retouch_versions WHERE order_id = ? ORDER BY created_at DESC')
      .all(orderId) as RetouchRow[];
  },
  insert(row: Omit<RetouchRow, 'id'>) {
    const id = genId('rt');
    db.prepare(
      `INSERT INTO retouch_versions (id, order_id, version_no, remark, created_at, actor_role, actor_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      row.order_id,
      row.version_no,
      row.remark ?? null,
      row.created_at,
      row.actor_role,
      row.actor_name,
    );
    return id;
  },
};
