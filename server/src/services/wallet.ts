import db from '../db';
import { PaginatedResponse, Wallet, WalletTransaction } from '../types';
import { buildWhereClause, getClientIp, logAudit } from '../utils';

function getConfigRules() {
  const stmt = db.prepare("SELECT * FROM configs WHERE key = 'rules'");
  const result = stmt.get() as { value: string } | undefined;

  if (!result) {
    return {
      deduct_priority: 'gift_first' as const,
      holiday_coefficient: 1.5,
      weekend_coefficient: 1.2,
      gift_validity_days: 365,
      recharge_gift_rules: [
        { threshold: 1000, gift_percent: 10 },
        { threshold: 3000, gift_percent: 15 },
        { threshold: 5000, gift_percent: 20 },
        { threshold: 10000, gift_percent: 30 }
      ],
      member_discount: {
        normal: 1.0,
        silver: 0.95,
        gold: 0.9,
        diamond: 0.85
      }
    };
  }

  try {
    return JSON.parse(result.value);
  } catch {
    return {
      deduct_priority: 'gift_first' as const,
      holiday_coefficient: 1.5,
      weekend_coefficient: 1.2,
      gift_validity_days: 365,
      recharge_gift_rules: [
        { threshold: 1000, gift_percent: 10 },
        { threshold: 3000, gift_percent: 15 },
        { threshold: 5000, gift_percent: 20 },
        { threshold: 10000, gift_percent: 30 }
      ],
      member_discount: {
        normal: 1.0,
        silver: 0.95,
        gold: 0.9,
        diamond: 0.85
      }
    };
  }
}

export interface TransactionFilters {
  member_id?: number;
  member_name_like?: string;
  phone_like?: string;
  type?: string;
  source?: string;
  reconciliation_status?: string;
  created_at_start?: string;
  created_at_end?: string;
  amount_min?: number;
  amount_max?: number;
  operator_id?: number;
  page?: number;
  pageSize?: number;
}

export interface RechargeRequest {
  member_id: number;
  amount: number;
  gift_amount?: number;
  remark?: string;
}

export interface DeductRequest {
  member_id: number;
  amount: number;
  source: string;
  source_id?: number;
  remark?: string;
}

export function getWalletTransactions(filters: TransactionFilters): PaginatedResponse<WalletTransaction & { member_name: string; operator_name: string }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhereClause({
    't.member_id': filters.member_id,
    'm.name_like': filters.member_name_like,
    'm.phone_like': filters.phone_like,
    't.type': filters.type,
    't.source': filters.source,
    't.reconciliation_status': filters.reconciliation_status,
    't.created_at_start': filters.created_at_start,
    't.created_at_end': filters.created_at_end,
    't.amount_min': filters.amount_min,
    't.amount_max': filters.amount_max,
    't.operator_id': filters.operator_id
  });

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM wallet_transactions t LEFT JOIN members m ON t.member_id = m.id ${clause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const txStmt = db.prepare(`
    SELECT t.*, m.name as member_name, u.name as operator_name
    FROM wallet_transactions t
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN users u ON t.operator_id = u.id
    ${clause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const items = txStmt.all(...params, pageSize, offset) as (WalletTransaction & { member_name: string; operator_name: string })[];

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export function getWalletByMemberId(memberId: number): Wallet | undefined {
  const stmt = db.prepare('SELECT * FROM wallets WHERE member_id = ?');
  return stmt.get(memberId) as Wallet | undefined;
}

export function calculateGiftAmount(amount: number): number {
  const config = getConfigRules();
  const rules = [...config.recharge_gift_rules].sort((a, b) => b.threshold - a.threshold);

  for (const rule of rules) {
    if (amount >= rule.threshold) {
      return Math.floor(amount * rule.gift_percent / 100);
    }
  }

  return 0;
}

export function recharge(req: any, operatorId: number, data: RechargeRequest) {
  const tx = db.transaction(() => {
    const wallet = getWalletByMemberId(data.member_id);
    if (!wallet) {
      throw new Error('会员账户不存在');
    }

    const giftAmount = calculateGiftAmount(data.amount);

    db.prepare(`
      UPDATE wallets
      SET principal_balance = principal_balance + ?,
          gift_balance = gift_balance + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE member_id = ?
    `).run(data.amount, giftAmount, data.member_id);

    const insertTx = db.prepare(`
      INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark)
      VALUES (?, ?, 'recharge', ?, ?, ?, 'recharge', NULL, ?, ?)
    `);

    const result = insertTx.run(
      wallet.id,
      data.member_id,
      data.amount + giftAmount,
      data.amount,
      giftAmount,
      operatorId,
      data.remark || null
    );

    const txId = result.lastInsertRowid as number;

    logAudit(
      operatorId,
      'wallet',
      'recharge',
      'wallet_transaction',
      txId,
      { principal_balance: wallet.principal_balance, gift_balance: wallet.gift_balance },
      { principal_balance: wallet.principal_balance + data.amount, gift_balance: wallet.gift_balance + giftAmount, recharge_amount: data.amount, gift_amount: giftAmount },
      getClientIp(req),
      req.headers['user-agent']
    );

    return txId;
  });

  return tx();
}

export function deduct(req: any, operatorId: number, data: DeductRequest) {
  const tx = db.transaction(() => {
    const wallet = getWalletByMemberId(data.member_id);
    if (!wallet) {
      throw new Error('会员账户不存在');
    }

    const totalBalance = wallet.principal_balance + wallet.gift_balance;
    if (totalBalance < data.amount) {
      throw new Error('余额不足');
    }

    const config = getConfigRules();
    const priority = config.deduct_priority;

    let giftDeduct = 0;
    let principalDeduct = 0;

    if (priority === 'gift_first') {
      giftDeduct = Math.min(wallet.gift_balance, data.amount);
      principalDeduct = data.amount - giftDeduct;
    } else {
      principalDeduct = Math.min(wallet.principal_balance, data.amount);
      giftDeduct = data.amount - principalDeduct;
    }

    db.prepare(`
      UPDATE wallets
      SET principal_balance = principal_balance - ?,
          gift_balance = gift_balance - ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE member_id = ?
    `).run(principalDeduct, giftDeduct, data.member_id);

    const insertTx = db.prepare(`
      INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark)
      VALUES (?, ?, 'consume', ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertTx.run(
      wallet.id,
      data.member_id,
      data.amount,
      principalDeduct,
      giftDeduct,
      data.source,
      data.source_id || null,
      operatorId,
      data.remark || null
    );

    const txId = result.lastInsertRowid as number;

    logAudit(
      operatorId,
      'wallet',
      'deduct',
      'wallet_transaction',
      txId,
      { principal_balance: wallet.principal_balance, gift_balance: wallet.gift_balance },
      {
        principal_balance: wallet.principal_balance - principalDeduct,
        gift_balance: wallet.gift_balance - giftDeduct,
        deduct_amount: data.amount,
        principal_deduct: principalDeduct,
        gift_deduct: giftDeduct
      },
      getClientIp(req),
      req.headers['user-agent']
    );

    return txId;
  });

  return tx();
}
