import db from '../db';
import { PaginatedResponse, Reconciliation, WalletTransaction } from '../types';
import { buildWhereClause, getClientIp, logAudit } from '../utils';

export interface ReconciliationFilters {
  reconciliation_date_start?: string;
  reconciliation_date_end?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AdjustRequest {
  transaction_id: number;
  adjust_amount: number;
  remark: string;
}

export function generateDailyReconciliation(date: string) {
  const tx = db.transaction(() => {
    const existing = db.prepare('SELECT id FROM reconciliations WHERE reconciliation_date = ?').get(date);
    if (existing) {
      throw new Error('该日期对账已存在');
    }

    const rechargeResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total,
             COALESCE(SUM(principal_amount), 0) as principal,
             COALESCE(SUM(gift_amount), 0) as gift
      FROM wallet_transactions
      WHERE type = 'recharge' AND DATE(created_at) = ?
    `).get(date) as { total: number; principal: number; gift: number };

    const consumeResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total,
             COALESCE(SUM(principal_amount), 0) as principal,
             COALESCE(SUM(gift_amount), 0) as gift
      FROM wallet_transactions
      WHERE type = 'consume' AND DATE(created_at) = ?
    `).get(date) as { total: number; principal: number; gift: number };

    const bookingCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE DATE(created_at) = ? AND status = 'completed'
    `).get(date) as { count: number };

    const expectedCash = rechargeResult.principal - consumeResult.principal;

    const insertReconciliation = db.prepare(`
      INSERT INTO reconciliations (reconciliation_date, total_recharge, total_consume, total_cash, difference, status)
      VALUES (?, ?, ?, ?, 0, 'pending')
    `);

    const result = insertReconciliation.run(
      date,
      rechargeResult.total,
      consumeResult.total,
      expectedCash
    );

    const reconciliationId = result.lastInsertRowid as number;

    db.prepare(`
      UPDATE wallet_transactions
      SET reconciliation_status = 'matched', reconciliation_id = ?
      WHERE DATE(created_at) = ?
    `).run(reconciliationId, date);

    return reconciliationId;
  });

  return tx();
}

export function getDailyReconciliation(date: string): Reconciliation | undefined {
  const stmt = db.prepare('SELECT * FROM reconciliations WHERE reconciliation_date = ?');
  return stmt.get(date) as Reconciliation | undefined;
}

export function getReconciliations(filters: ReconciliationFilters): PaginatedResponse<Reconciliation & { reviewer_name: string | null }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    'reconciliation_date_start': filters.reconciliation_date_start,
    'reconciliation_date_end': filters.reconciliation_date_end,
    'status': filters.status
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM reconciliations ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const reconStmt = db.prepare(`
    SELECT r.*, u.name as reviewer_name
    FROM reconciliations r
    LEFT JOIN users u ON r.reviewed_by = u.id
    ${clause}
    ORDER BY r.reconciliation_date DESC
    LIMIT ? OFFSET ?
  `);

  const items = reconStmt.all(...params, pageSize, offset) as (Reconciliation & { reviewer_name: string | null })[];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getReconciliationDetails(reconciliationId: number): {
  reconciliation: Reconciliation;
  transactions: WalletTransaction[];
  statistics: {
    recharge_count: number;
    consume_count: number;
    member_count: number;
  };
} {
  const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(reconciliationId) as Reconciliation;
  if (!reconciliation) {
    throw new Error('对账单不存在');
  }

  const transactions = db.prepare(`
    SELECT t.*, m.name as member_name, u.name as operator_name
    FROM wallet_transactions t
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN users u ON t.operator_id = u.id
    WHERE t.reconciliation_id = ?
    ORDER BY t.created_at DESC
  `).all(reconciliationId) as WalletTransaction[];

  const statistics = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'recharge' THEN 1 ELSE 0 END) as recharge_count,
      SUM(CASE WHEN type = 'consume' THEN 1 ELSE 0 END) as consume_count,
      COUNT(DISTINCT member_id) as member_count
    FROM wallet_transactions
    WHERE reconciliation_id = ?
  `).get(reconciliationId) as { recharge_count: number; consume_count: number; member_count: number };

  return {
    reconciliation,
    transactions,
    statistics
  };
}

export function approveReconciliation(req: any, operatorId: number, reconciliationId: number, remark?: string) {
  const tx = db.transaction(() => {
    const recon = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(reconciliationId) as Reconciliation;
    if (!recon) {
      throw new Error('对账单不存在');
    }

    db.prepare(`
      UPDATE reconciliations
      SET status = 'approved',
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          remark = ?
      WHERE id = ?
    `).run(operatorId, remark || null, reconciliationId);

    logAudit(
      operatorId,
      'reconciliation',
      'approve',
      'reconciliation',
      reconciliationId,
      { status: recon.status },
      { status: 'approved', remark },
      getClientIp(req),
      req.headers['user-agent']
    );

    return reconciliationId;
  });

  return tx();
}

export function adjustTransaction(req: any, operatorId: number, data: AdjustRequest) {
  const tx = db.transaction(() => {
    const originalTx = db.prepare('SELECT * FROM wallet_transactions WHERE id = ?').get(data.transaction_id) as WalletTransaction;
    if (!originalTx) {
      throw new Error('交易记录不存在');
    }

    const wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(originalTx.wallet_id) as any;

    const newPrincipal = data.adjust_amount > 0 ? data.adjust_amount : 0;
    const newGift = data.adjust_amount > 0 ? 0 : Math.abs(data.adjust_amount);

    db.prepare(`
      UPDATE wallets
      SET principal_balance = principal_balance + ?,
          gift_balance = gift_balance + ?
      WHERE id = ?
    `).run(newPrincipal, newGift, originalTx.wallet_id);

    const insertTx = db.prepare(`
      INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark, reconciliation_status)
      VALUES (?, ?, 'adjust', ?, ?, ?, 'adjustment', ?, ?, ?, 'pending')
    `);

    const result = insertTx.run(
      originalTx.wallet_id,
      originalTx.member_id,
      data.adjust_amount,
      newPrincipal,
      newGift,
      data.transaction_id,
      operatorId,
      data.remark,
      'pending'
    );

    const newTxId = result.lastInsertRowid as number;

    db.prepare(`
      UPDATE wallet_transactions
      SET reconciliation_status = 'mismatched'
      WHERE id = ?
    `).run(data.transaction_id);

    logAudit(
      operatorId,
      'reconciliation',
      'adjust',
      'wallet_transaction',
      data.transaction_id,
      { original_amount: originalTx.amount, reconciliation_status: originalTx.reconciliation_status },
      {
        adjust_amount: data.adjust_amount,
        new_transaction_id: newTxId,
        original_status: originalTx.reconciliation_status,
        new_status: 'mismatched',
        remark: data.remark
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    return newTxId;
  });

  return tx();
}

export function getStatistics() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const todayRecharge = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total,
           COALESCE(SUM(gift_amount), 0) as gift_total
    FROM wallet_transactions
    WHERE type = 'recharge' AND DATE(created_at) = ?
  `).get(today) as { total: number; gift_total: number };

  const todayConsume = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total,
           COUNT(*) as count
    FROM wallet_transactions
    WHERE type = 'consume' AND DATE(created_at) = ?
  `).get(today) as { total: number; count: number };

  const todayPendingRecon = db.prepare(`
    SELECT COUNT(*) as count
    FROM wallet_transactions
    WHERE reconciliation_status = 'pending' AND DATE(created_at) = ?
  `).get(today) as { count: number };

  const todayAdjusted = db.prepare(`
    SELECT COUNT(*) as count
    FROM wallet_transactions
    WHERE reconciliation_status = 'adjusted' AND DATE(created_at) = ?
  `).get(today) as { count: number };

  const dailyStats = db.prepare(`
    SELECT
      DATE(created_at) as date,
      SUM(CASE WHEN type = 'recharge' THEN amount ELSE 0 END) as recharge,
      SUM(CASE WHEN type = 'consume' THEN amount ELSE 0 END) as consume,
      COUNT(DISTINCT member_id) as active_members
    FROM wallet_transactions
    WHERE DATE(created_at) >= ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(sevenDaysAgo);

  const bookingStats = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as booking_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
    FROM bookings
    WHERE DATE(created_at) >= ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(sevenDaysAgo);

  const pendingReconciliation = db.prepare(`
    SELECT COUNT(*) as count
    FROM reconciliations
    WHERE status = 'pending'
  `).get() as { count: number };

  const pendingExceptions = db.prepare(`
    SELECT COUNT(*) as count
    FROM exceptions
    WHERE status IN ('pending', 'processing')
  `).get() as { count: number };

  return {
    todaySummary: {
      recharge_total: todayRecharge.total,
      recharge_gift: todayRecharge.gift_total,
      consume_total: todayConsume.total,
      consume_count: todayConsume.count,
      pending_count: todayPendingRecon.count,
      adjusted_count: todayAdjusted.count,
    },
    dailyStats,
    bookingStats,
    pendingReconciliation: pendingReconciliation.count,
    pendingExceptions: pendingExceptions.count
  };
}
