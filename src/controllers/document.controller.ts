import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuditAction, Role } from '../types';
import { DocumentService } from '../services/document.service';
import { AppError } from '../middleware/errorHandler';
import { DocumentType, DocumentStatus } from '../types';
import { CommentService } from '../services/comment.service';
import { AuditService } from '../services/audit.service';

export const createDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const document = await DocumentService.create(req.user, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: document,
      message: '证件任务创建成功',
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const document = await DocumentService.update(
      req.user,
      req.params.id,
      req.body,
      req.ip
    );

    res.json({
      success: true,
      data: document,
      message: '证件任务更新成功',
    });
  } catch (error) {
    next(error);
  }
};

export const startProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const document = await DocumentService.startProgress(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: document,
      message: '已开始办理',
    });
  } catch (error) {
    next(error);
  }
};

export const submitDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const document = await DocumentService.submit(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: document,
      message: '已提交审核',
    });
  } catch (error) {
    next(error);
  }
};

export const approveDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const document = await DocumentService.approve(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: document,
      message: '审批通过',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const { reason } = req.body;
    if (!reason) throw new AppError('请填写驳回原因', 400);

    const document = await DocumentService.reject(
      req.user,
      req.params.id,
      reason,
      req.ip
    );

    res.json({
      success: true,
      data: document,
      message: '已驳回',
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const document = await DocumentService.getById(req.user, req.params.id);

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const { projectId, type, status, assigneeId, page, pageSize } = req.query;

    const result = await DocumentService.getList(req.user, {
      projectId: projectId as string,
      type: type as DocumentType,
      status: status as DocumentStatus,
      assigneeId: assigneeId as string,
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

    const document = await DocumentService.getById(req.user, req.params.id);
    if (!document) throw new AppError('证件任务不存在', 404);

    const comment = await CommentService.addComment(
      req.user,
      'Document',
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

    const document = await DocumentService.getById(req.user, req.params.id);
    if (!document) throw new AppError('证件任务不存在', 404);

    const logs = await AuditService.getEntityLogs('Document', req.params.id);

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
