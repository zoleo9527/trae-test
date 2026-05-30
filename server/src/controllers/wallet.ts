import { Request, Response } from 'express';
import * as walletService from '../services/wallet';
import { DeductRequest, RechargeRequest, TransactionFilters } from '../services/wallet';

export async function getTransactions(req: Request, res: Response) {
  const filters: TransactionFilters = {
    member_id: req.query.member_id ? parseInt(req.query.member_id as string) : undefined,
    member_name_like: req.query.member_name_like as string,
    phone_like: req.query.phone_like as string,
    type: req.query.type as string,
    source: req.query.source as string,
    reconciliation_status: req.query.reconciliation_status as string,
    created_at_start: req.query.created_at_start as string,
    created_at_end: req.query.created_at_end as string,
    amount_min: req.query.amount_min ? parseFloat(req.query.amount_min as string) : undefined,
    amount_max: req.query.amount_max ? parseFloat(req.query.amount_max as string) : undefined,
    operator_id: req.query.operator_id ? parseInt(req.query.operator_id as string) : undefined,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = walletService.getWalletTransactions(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function recharge(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: RechargeRequest = req.body;

  if (!data.member_id || !data.amount || data.amount <= 0) {
    return res.status(400).json({
      success: false,
      message: '会员ID和充值金额（大于0）不能为空'
    });
  }

  try {
    const transactionId = walletService.recharge(req, req.user.userId, data);
    res.json({
      success: true,
      message: '充值成功',
      data: { transaction_id: transactionId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function deduct(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: DeductRequest = req.body;

  if (!data.member_id || !data.amount || data.amount <= 0 || !data.source) {
    return res.status(400).json({
      success: false,
      message: '会员ID、扣减金额（大于0）和来源不能为空'
    });
  }

  try {
    const transactionId = walletService.deduct(req, req.user.userId, data);
    res.json({
      success: true,
      message: '扣减成功',
      data: { transaction_id: transactionId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}
