import { Request, Response } from 'express';
import * as auditLogService from '../services/auditLog';
import { AuditLogFilters } from '../services/auditLog';

export async function getAuditLogs(req: Request, res: Response) {
  const filters: AuditLogFilters = {
    user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
    module: req.query.module as string,
    action: req.query.action as string,
    target_type: req.query.target_type as string,
    created_at_start: req.query.created_at_start as string,
    created_at_end: req.query.created_at_end as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = auditLogService.getAuditLogs(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function getAuditLogById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const log = auditLogService.getAuditLogById(id);

  if (!log) {
    return res.status(404).json({
      success: false,
      message: '日志不存在'
    });
  }

  res.json({
    success: true,
    message: '获取成功',
    data: log
  });
}
