import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { getOperationLogsByInquiry, getOperationLogs } from '../services/auditLog';

export async function getLogsByInquiryController(req: Request, res: Response) {
  const { inquiryId } = req.params;
  const result = await getOperationLogsByInquiry(inquiryId as string);
  return sendSuccess(res, result);
}

export async function getLogsController(req: Request, res: Response) {
  const filters = {
    operatorId: req.query.operatorId as string,
    operationType: req.query.operationType as any,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
  };
  const result = await getOperationLogs(filters);
  return sendSuccess(res, result.items, '查询成功', {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: Math.ceil(result.total / result.pageSize),
  });
}

export { getLogsController as getAuditLogsController, getLogsByInquiryController as getAuditLogsByInquiryController };
