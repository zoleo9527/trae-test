import db from '../db';
import { Equipment, EquipmentRecord, PaginatedResponse } from '../types';
import { buildWhereClause, getClientIp, logAudit } from '../utils';

export interface EquipmentRecordFilters {
  member_id?: number;
  equipment_id?: number;
  booking_id?: number;
  return_status?: string;
  borrow_at_start?: string;
  borrow_at_end?: string;
  page?: number;
  pageSize?: number;
}

export interface BorrowRequest {
  equipment_id: number;
  member_id: number;
  booking_id?: number;
}

export interface ReturnRequest {
  record_id: number;
  return_status: 'normal' | 'damaged' | 'lost';
  damage_remark?: string;
  damage_fee?: number;
}

export function getEquipments(): Equipment[] {
  const stmt = db.prepare('SELECT * FROM equipments WHERE status = \'active\' ORDER BY category, name');
  return stmt.all() as Equipment[];
}

export function getEquipmentRecords(filters: EquipmentRecordFilters): PaginatedResponse<EquipmentRecord & { equipment_name: string; member_name: string; borrower_name: string; returner_name: string | null }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    'er.member_id': filters.member_id,
    'er.equipment_id': filters.equipment_id,
    'er.booking_id': filters.booking_id,
    'er.return_status': filters.return_status,
    'er.borrow_at_start': filters.borrow_at_start,
    'er.borrow_at_end': filters.borrow_at_end
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM equipment_records er ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const recordStmt = db.prepare(`
    SELECT er.*, e.name as equipment_name, m.name as member_name,
           ub.name as borrower_name, ur.name as returner_name
    FROM equipment_records er
    LEFT JOIN equipments e ON er.equipment_id = e.id
    LEFT JOIN members m ON er.member_id = m.id
    LEFT JOIN users ub ON er.borrow_operator_id = ub.id
    LEFT JOIN users ur ON er.return_operator_id = ur.id
    ${clause}
    ORDER BY er.borrow_at DESC
    LIMIT ? OFFSET ?
  `);

  const items = recordStmt.all(...params, pageSize, offset) as (EquipmentRecord & { equipment_name: string; member_name: string; borrower_name: string; returner_name: string | null })[];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function borrowEquipment(req: any, operatorId: number, data: BorrowRequest) {
  const tx = db.transaction(() => {
    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(data.equipment_id) as Equipment | undefined;
    if (!equipment) {
      throw new Error('器材不存在');
    }

    if (equipment.available_quantity <= 0) {
      throw new Error('器材库存不足');
    }

    db.prepare(`
      UPDATE equipments
      SET available_quantity = available_quantity - 1
      WHERE id = ?
    `).run(data.equipment_id);

    const insertRecord = db.prepare(`
      INSERT INTO equipment_records (equipment_id, member_id, booking_id, borrow_operator_id)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertRecord.run(
      data.equipment_id,
      data.member_id,
      data.booking_id || null,
      operatorId
    );

    const recordId = result.lastInsertRowid as number;

    logAudit(
      operatorId,
      'equipment',
      'borrow',
      'equipment_record',
      recordId,
      { available_quantity: equipment.available_quantity },
      { available_quantity: equipment.available_quantity - 1, equipment_id: data.equipment_id, member_id: data.member_id },
      getClientIp(req),
      req.headers['user-agent']
    );

    return recordId;
  });

  return tx();
}

export function returnEquipment(req: any, operatorId: number, data: ReturnRequest) {
  const tx = db.transaction(() => {
    const record = db.prepare('SELECT * FROM equipment_records WHERE id = ?').get(data.record_id) as EquipmentRecord | undefined;
    if (!record) {
      throw new Error('借还记录不存在');
    }

    if (record.return_at) {
      throw new Error('该器材已归还');
    }

    db.prepare(`
      UPDATE equipment_records
      SET return_operator_id = ?,
          return_at = CURRENT_TIMESTAMP,
          return_status = ?,
          damage_remark = ?,
          damage_fee = ?
      WHERE id = ?
    `).run(
      operatorId,
      data.return_status,
      data.damage_remark || null,
      data.damage_fee || 0,
      data.record_id
    );

    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(record.equipment_id) as Equipment;

    if (data.return_status !== 'lost') {
      db.prepare(`
        UPDATE equipments
        SET available_quantity = available_quantity + 1
        WHERE id = ?
      `).run(record.equipment_id);
    }

    if (data.damage_fee && data.damage_fee > 0 && record.member_id) {
      const walletStmt = db.prepare('SELECT * FROM wallets WHERE member_id = ?');
      const wallet = walletStmt.get(record.member_id) as any;

      db.prepare(`
        UPDATE wallets
        SET principal_balance = principal_balance - ?
        WHERE member_id = ?
      `).run(data.damage_fee, record.member_id);

      db.prepare(`
        INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark)
        VALUES (?, ?, 'consume', ?, ?, 0, 'equipment_damage', ?, ?, ?)
      `).run(
        wallet.id,
        record.member_id,
        data.damage_fee,
        data.damage_fee,
        data.record_id,
        operatorId,
        data.damage_remark || '器材损坏赔偿'
      );
    }

    logAudit(
      operatorId,
      'equipment',
      'return',
      'equipment_record',
      data.record_id,
      { return_status: null, available_quantity: equipment.available_quantity },
      {
        return_status: data.return_status,
        damage_fee: data.damage_fee || 0,
        available_quantity: data.return_status !== 'lost' ? equipment.available_quantity + 1 : equipment.available_quantity
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    return data.record_id;
  });

  return tx();
}
