import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import {
  createStockLock,
  updateStockLock,
  updateStockLockStatus,
  getStockLock,
  getStockLockByInquiry,
  getStockLockList,
  addStockLockRemark,
} from '../services/stockLock';
import { QueryFilterDto } from '../types/dto';

export async function createStockLockController(req: Request, res: Response) {
  const result = await createStockLock(req.body, req.user, req);
  return sendSuccess(res, result, '锁库单创建成功');
}

export async function updateStockLockController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateStockLock(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '锁库单更新成功');
}

export async function updateStockLockStatusController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateStockLockStatus(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '状态更新成功');
}

export async function getStockLockController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await getStockLock(id as string);
  return sendSuccess(res, result);
}

export async function getStockLockByInquiryController(req: Request, res: Response) {
  const { inquiryId } = req.params;
  const result = await getStockLockByInquiry(inquiryId as string);
  return sendSuccess(res, result);
}

export async function getStockLockListController(req: Request, res: Response) {
  const result = await getStockLockList(req.query as unknown as QueryFilterDto, req.user);
  return sendSuccess(res, result.items, '查询成功', result.pagination);
}

export async function addStockLockRemarkController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await addStockLockRemark(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '备注添加成功');
}
