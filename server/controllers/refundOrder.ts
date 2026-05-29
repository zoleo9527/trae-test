import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import {
  createRefundOrder,
  updateRefundOrder,
  updateRefundOrderStatus,
  getRefundOrder,
  getRefundOrderByInquiry,
  getRefundOrderByReturn,
  getRefundOrderList,
  addRefundOrderRemark,
} from '../services/refundOrder';
import { QueryFilterDto } from '../types/dto';

export async function createRefundOrderController(req: Request, res: Response) {
  const result = await createRefundOrder(req.body, req.user, req);
  return sendSuccess(res, result, '退款单创建成功');
}

export async function updateRefundOrderController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateRefundOrder(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '退款单更新成功');
}

export async function updateRefundOrderStatusController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateRefundOrderStatus(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '状态更新成功');
}

export async function getRefundOrderController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await getRefundOrder(id as string);
  return sendSuccess(res, result);
}

export async function getRefundOrderByInquiryController(req: Request, res: Response) {
  const { inquiryId } = req.params;
  const result = await getRefundOrderByInquiry(inquiryId as string);
  return sendSuccess(res, result);
}

export async function getRefundOrderByReturnController(req: Request, res: Response) {
  const { returnOrderId } = req.params;
  const result = await getRefundOrderByReturn(returnOrderId as string);
  return sendSuccess(res, result);
}

export async function getRefundOrderListController(req: Request, res: Response) {
  const result = await getRefundOrderList(req.query as unknown as QueryFilterDto, req.user);
  return sendSuccess(res, result.items, '查询成功', result.pagination);
}

export async function addRefundOrderRemarkController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await addRefundOrderRemark(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '备注添加成功');
}
