import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ReconciliationStatus, AuditAction, Role } from '../types';
import { ReconciliationService } from '../services/reconciliation.service';
import { AppError } from '../middleware/errorHandler';

import { CommentService } from '../services/comment.service';
import { AuditService } from '../services/audit.service';

export const createReconciliation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const reconciliation = await ReconciliationService.create(req.user, req.body, req.ip);
    
    res.status(201).json({
      success: true,
      data: reconciliation,
      message: '对账单创建成功',
    });
  } catch (error) {
    next(error);
  }
};

export const updateReconciliation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const reconciliation = await ReconciliationService.update(
      req.user,
      req.params.id,
      req.body,
      req.ip
    );
    
    res.json({
      success: true,
      data: reconciliation,
      message: '对账单更新成功',
    });
  } catch (error) {
    next(error);
  }
};

export const submitReconciliation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const reconciliation = await ReconciliationService.submit(
      req.user,
      req.params.id,
      req.ip
    );
    
    res.json({
      success: true,
      data: reconciliation,
      message: '对账单提交成功',
    });
  } catch (error) {
    next(error);
  }
};

export const approveReconciliation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { confirmedAmount } = req.body;
    const reconciliation = await ReconciliationService.approve(
      req.user,
      req.params.id,
      confirmedAmount,
      req.ip
    );
    
    res.json({
      success: true,
      data: reconciliation,
      message: '对账单审批通过',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectReconciliation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { reason } = req.body;
    if (!reason) throw new AppError('请填写驳回原因', 400);
    
    const reconciliation = await ReconciliationService.reject(
      req.user,
      req.params.id,
      reason,
      req.ip
    );
    
    res.json({
      success: true,
      data: reconciliation,
      message: '对账单已驳回',
    });
  } catch (error) {
    next(error);
  }
};

export const requestRevise = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { note } = req.body;
    if (!note) throw new AppError('请填写修改说明', 400);
    
    const reconciliation = await ReconciliationService.requestRevise(
      req.user,
      req.params.id,
      note,
      req.ip
    );
    
    res.json({
      success: true,
      data: reconciliation,
      message: '已退回修改',
    });
  } catch (error) {
    next(error);
  }
};

export const getReconciliation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const reconciliation = await ReconciliationService.getById(req.user, req.params.id);
    
    res.json({
      success: true,
      data: reconciliation,
    });
  } catch (error) {
    next(error);
  }
};

export const getReconciliationList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { projectId, supplierId, status, page, pageSize } = req.query;
    
    const result = await ReconciliationService.getList(req.user, {
      projectId: projectId as string,
      supplierId: supplierId as string,
      status: status as ReconciliationStatus,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const { content, parentId } = req.body;
    if (!content) throw new AppError('备注内容不能为空', 400);

    const reconciliation = await ReconciliationService.getById(req.user, req.params.id);
    if (!reconciliation) throw new AppError('对账单不存在', 404);

    const comment = await CommentService.addComment(
      req.user,
      'Reconciliation',
      req.params.id,
      content,
      parentId,
      req.ip
    );

    res.status(201).json({
      success: true,
      data: comment,
      message: '备注添加成功',
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const reconciliation = await ReconciliationService.getById(req.user, req.params.id);
    if (!reconciliation) throw new AppError('对账单不存在', 404);

    const logs = await AuditService.getEntityLogs('Reconciliation', req.params.id);

    const filteredLogs = logs.filter(log => {
      if (req.user!.role === Role.SUPPLIER_CONTACT) {
        const allowedActions: AuditAction[] = [
          AuditAction.CREATE,
          AuditAction.SUBMIT,
          AuditAction.APPROVE,
          AuditAction.REJECT,
          AuditAction.COMPLETE,
          AuditAction.UPDATE,
        ];
        return allowedActions.includes(log.action as AuditAction);
      }
      return true;
    }).map(log => {
      if (req.user!.role === Role.SUPPLIER_CONTACT) {
        const { oldValue, newValue, fieldName, ...safeLog } = log;
        return safeLog;
      }
      return log;
    });

    res.json({
      success: true,
      data: filteredLogs,
    });
  } catch (error) {
    next(error);
  }
};
