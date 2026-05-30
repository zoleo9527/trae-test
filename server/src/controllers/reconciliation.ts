import { Request, Response } from 'express';
import * as reconciliationService from '../services/reconciliation';
import { AdjustRequest, ReconciliationFilters } from '../services/reconciliation';

export async function generateDaily(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const { date } = req.body;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: '对账日期不能为空'
    });
  }

  try {
    const reconciliationId = reconciliationService.generateDailyReconciliation(date);
    res.json({
      success: true,
      message: '对账生成成功',
      data: { reconciliation_id: reconciliationId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function getDaily(req: Request, res: Response) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: '对账日期不能为空'
    });
  }

  const reconciliation = reconciliationService.getDailyReconciliation(date as string);

  res.json({
    success: true,
    message: '获取成功',
    data: reconciliation
  });
}

export async function getReconciliations(req: Request, res: Response) {
  const filters: ReconciliationFilters = {
    reconciliation_date_start: req.query.reconciliation_date_start as string,
    reconciliation_date_end: req.query.reconciliation_date_end as string,
    status: req.query.status as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = reconciliationService.getReconciliations(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function getDetails(req: Request, res: Response) {
  const id = parseInt(req.params.id);

  try {
    const details = reconciliationService.getReconciliationDetails(id);
    res.json({
      success: true,
      message: '获取成功',
      data: details
    });
  } catch (err: any) {
    res.status(404).json({
      success: false,
      message: err.message
    });
  }
}

export async function approve(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const id = parseInt(req.params.id);
  const { remark } = req.body;

  try {
    const reconciliationId = reconciliationService.approveReconciliation(req, req.user.userId, id, remark);
    res.json({
      success: true,
      message: '审核通过',
      data: { reconciliation_id: reconciliationId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function adjust(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: AdjustRequest = req.body;

  if (!data.transaction_id || data.adjust_amount === undefined || !data.remark) {
    return res.status(400).json({
      success: false,
      message: '交易ID、调账金额和备注不能为空'
    });
  }

  try {
    const transactionId = reconciliationService.adjustTransaction(req, req.user.userId, data);
    res.json({
      success: true,
      message: '调账成功',
      data: { new_transaction_id: transactionId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function getStatistics(req: Request, res: Response) {
  const statistics = reconciliationService.getStatistics();
  res.json({
    success: true,
    message: '获取成功',
    data: statistics
  });
}
