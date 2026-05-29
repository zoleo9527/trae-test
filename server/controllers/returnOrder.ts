import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import {
  createReturnOrder,
  updateReturnOrder,
  updateReturnOrderStatus,
  inspectReturnItem,
  getReturnOrder,
  getReturnOrderByInquiry,
  getReturnOrderList,
  addReturnOrderRemark,
  addReturnOrderEvidence,
} from '../services/returnOrder';
import { QueryFilterDto } from '../types/dto';

export async function createReturnOrderController(req: Request, res: Response) {
  const result = await createReturnOrder(req.body, req.user, req);
  return sendSuccess(res, result, '退货单创建成功');
}

export async function updateReturnOrderController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateReturnOrder(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '退货单更新成功');
}

export async function updateReturnOrderStatusController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateReturnOrderStatus(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '状态更新成功');
}

export async function inspectReturnItemController(req: Request, res: Response) {
  const { id, itemId } = req.params;
  const result = await inspectReturnItem(id as string, itemId as string, req.body, req.user, req);
  return sendSuccess(res, result, '核验完成');
}

export async function getReturnOrderController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await getReturnOrder(id as string);
  return sendSuccess(res, result);
}

export async function getReturnOrderByInquiryController(req: Request, res: Response) {
  const { inquiryId } = req.params;
  const result = await getReturnOrderByInquiry(inquiryId as string);
  return sendSuccess(res, result);
}

export async function getReturnOrderListController(req: Request, res: Response) {
  const result = await getReturnOrderList(req.query as unknown as QueryFilterDto, req.user);
  return sendSuccess(res, result.items, '查询成功', result.pagination);
}

export async function addReturnOrderRemarkController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await addReturnOrderRemark(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '备注添加成功');
}

export async function addReturnOrderEvidenceController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await addReturnOrderEvidence(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '证据添加成功');
}
