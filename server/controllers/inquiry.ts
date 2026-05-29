import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import {
  createInquiry,
  updateInquiry,
  updateInquiryStatus,
  getInquiry,
  getInquiryList,
  addInquiryRemark,
} from '../services/inquiry';
import { QueryFilterDto } from '../types/dto';

export async function createInquiryController(req: Request, res: Response) {
  const result = await createInquiry(req.body, req.user, req);
  return sendSuccess(res, result, '询价单创建成功');
}

export async function updateInquiryController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateInquiry(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '询价单更新成功');
}

export async function updateInquiryStatusController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await updateInquiryStatus(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '状态更新成功');
}

export async function getInquiryController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await getInquiry(id as string);
  return sendSuccess(res, result);
}

export async function getInquiryListController(req: Request, res: Response) {
  const result = await getInquiryList(req.query as unknown as QueryFilterDto, req.user);
  return sendSuccess(res, result.items, '查询成功', result.pagination);
}

export async function addInquiryRemarkController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await addInquiryRemark(id as string, req.body, req.user, req);
  return sendSuccess(res, result, '备注添加成功');
}
