import db from '../db';
import { Member, PaginatedResponse, TimelineEvent, Wallet } from '../types';
import { buildWhereClause, getClientIp, logAudit } from '../utils';

export interface MemberFilters {
  name_like?: string;
  phone_like?: string;
  member_type?: string;
  created_at_start?: string;
  created_at_end?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateMemberRequest {
  name: string;
  phone: string;
  member_type?: 'normal' | 'silver' | 'gold' | 'diamond';
  birthday?: string;
  remark?: string;
}

export function getMembers(filters: MemberFilters): PaginatedResponse<Member & { wallet: Wallet }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    'm.name_like': filters.name_like,
    'm.phone_like': filters.phone_like,
    'm.member_type': filters.member_type,
    'm.created_at_start': filters.created_at_start,
    'm.created_at_end': filters.created_at_end
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM members m ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const membersStmt = db.prepare(`
    SELECT m.*, w.principal_balance, w.gift_balance, w.frozen_balance
    FROM members m
    LEFT JOIN wallets w ON m.id = w.member_id
    ${clause}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = membersStmt.all(...params, pageSize, offset) as any[];

  const items = rows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    member_type: row.member_type,
    birthday: row.birthday,
    remark: row.remark,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    wallet: {
      id: row.wallet_id,
      member_id: row.id,
      principal_balance: row.principal_balance,
      gift_balance: row.gift_balance,
      frozen_balance: row.frozen_balance,
      created_at: row.created_at,
      updated_at: row.updated_at
    } as Wallet
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getMemberById(id: number): (Member & { wallet: Wallet }) | undefined {
  const stmt = db.prepare(`
    SELECT m.*, w.id as wallet_id, w.principal_balance, w.gift_balance, w.frozen_balance, w.created_at as wallet_created, w.updated_at as wallet_updated
    FROM members m
    LEFT JOIN wallets w ON m.id = w.member_id
    WHERE m.id = ?
  `);
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    member_type: row.member_type,
    birthday: row.birthday,
    remark: row.remark,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    wallet: {
      id: row.wallet_id,
      member_id: row.id,
      principal_balance: row.principal_balance,
      gift_balance: row.gift_balance,
      frozen_balance: row.frozen_balance,
      created_at: row.wallet_created,
      updated_at: row.wallet_updated
    }
  };
}

export function createMember(req: any, operatorId: number, data: CreateMemberRequest) {
  const tx = db.transaction(() => {
    const insertMember = db.prepare(`
      INSERT INTO members (name, phone, member_type, birthday, remark, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertMember.run(
      data.name,
      data.phone,
      data.member_type || 'normal',
      data.birthday || null,
      data.remark || null,
      operatorId
    );

    const memberId = result.lastInsertRowid as number;

    db.prepare(`
      INSERT INTO wallets (member_id, principal_balance, gift_balance, frozen_balance)
      VALUES (?, 0.00, 0.00, 0.00)
    `).run(memberId);

    logAudit(
      operatorId,
      'member',
      'create',
      'member',
      memberId,
      null,
      data,
      getClientIp(req),
      req.headers['user-agent']
    );

    return memberId;
  });

  const memberId = tx();
  return getMemberById(memberId);
}

export function getMemberTimeline(memberId: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const txStmt = db.prepare(`
    SELECT t.*, u.name as operator_name
    FROM wallet_transactions t
    LEFT JOIN users u ON t.operator_id = u.id
    WHERE t.member_id = ?
    ORDER BY t.created_at DESC
    LIMIT 50
  `);
  const transactions = txStmt.all(memberId) as any[];

  for (const tx of transactions) {
    events.push({
      id: tx.id,
      type: tx.type === 'recharge' ? 'recharge' : 'consume',
      title: tx.type === 'recharge' ? '储值充值' : '消费扣减',
      description: tx.remark || (tx.type === 'recharge' ? `充值 ${tx.amount} 元` : `消费 ${tx.amount} 元`),
      amount: tx.amount,
      operator_name: tx.operator_name,
      created_at: tx.created_at,
      details: tx
    });
  }

  const bookingStmt = db.prepare(`
    SELECT b.*, u.name as operator_name, bay.name as bay_name
    FROM bookings b
    LEFT JOIN users u ON b.created_by = u.id
    LEFT JOIN bays bay ON b.bay_id = bay.id
    WHERE b.member_id = ?
    ORDER BY b.created_at DESC
    LIMIT 50
  `);
  const bookings = bookingStmt.all(memberId) as any[];

  for (const booking of bookings) {
    const statusMap: Record<string, string> = {
      booked: '已预约',
      checked_in: '已到场',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '未到场'
    };
    events.push({
      id: booking.id,
      type: 'booking',
      title: `球道预约 - ${booking.bay_name}`,
      description: `${booking.booking_date} ${booking.start_time}-${booking.end_time}，状态：${statusMap[booking.status]}`,
      amount: booking.total_amount,
      operator_name: booking.operator_name,
      created_at: booking.created_at,
      details: booking
    });
  }

  const equipStmt = db.prepare(`
    SELECT e.*, u.name as operator_name, eq.name as equipment_name
    FROM equipment_records e
    LEFT JOIN users u ON e.borrow_operator_id = u.id
    LEFT JOIN equipments eq ON e.equipment_id = eq.id
    WHERE e.member_id = ?
    ORDER BY e.created_at DESC
    LIMIT 50
  `);
  const equipmentRecords = equipStmt.all(memberId) as any[];

  for (const record of equipmentRecords) {
    const action = record.return_at ? '归还' : '借出';
    const status = record.return_status ? (record.return_status === 'normal' ? '正常归还' : record.return_status === 'damaged' ? '损坏归还' : '遗失') : '使用中';
    events.push({
      id: record.id,
      type: 'equipment',
      title: `器材${action} - ${record.equipment_name}`,
      description: record.return_at ? `${status}，${record.damage_fee > 0 ? `赔偿费：${record.damage_fee}元` : '无损坏'}` : '借出未归还',
      operator_name: record.operator_name,
      created_at: record.borrow_at,
      details: record
    });
  }

  const exStmt = db.prepare(`
    SELECT e.*, u.name as creator_name
    FROM exceptions e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.member_id = ?
    ORDER BY e.created_at DESC
    LIMIT 50
  `);
  const exceptions = exStmt.all(memberId) as any[];

  for (const ex of exceptions) {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    };
    events.push({
      id: ex.id,
      type: 'exception',
      title: `异常工单 - ${ex.title}`,
      description: `状态：${statusMap[ex.status]}，${ex.description.substring(0, 50)}...`,
      operator_name: ex.creator_name,
      created_at: ex.created_at,
      details: ex
    });
  }

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return events.slice(0, 100);
}
