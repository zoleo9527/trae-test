import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuditAction, Role } from '../types';
import { TeardownService } from '../services/teardown.service';
import { AppError } from '../middleware/errorHandler';
import { TeardownStatus } from '../types';
import { CommentService } from '../services/comment.service';
import { AuditService } from '../services/audit.service';

export const createTeardown = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const teardown = await TeardownService.create(req.user, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: teardown,
      message: '撤场复盘创建成功',
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeardown = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const teardown = await TeardownService.update(
      req.user,
      req.params.id,
      req.body,
      req.ip
    );

    res.json({
      success: true,
      data: teardown,
      message: '撤场复盘更新成功',
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

    const teardown = await TeardownService.startProgress(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: teardown,
      message: '已开始撤场',
    });
  } catch (error) {
    next(error);
  }
};

export const markMaterialsReturned = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const teardown = await TeardownService.markMaterialsReturned(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: teardown,
      message: '物料已归还',
    });
  } catch (error) {
    next(error);
  }
};

export const markSiteCleared = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const teardown = await TeardownService.markSiteCleared(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: teardown,
      message: '场地已清场',
    });
  } catch (error) {
    next(error);
  }
};

export const completeTeardown = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const teardown = await TeardownService.complete(
      req.user,
      req.params.id,
      req.ip
    );

    res.json({
      success: true,
      data: teardown,
      message: '撤场复盘完成，项目已自动结案',
    });
  } catch (error) {
    next(error);
  }
};

export const getTeardown = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const teardown = await TeardownService.getById(req.user, req.params.id);

    res.json({
      success: true,
      data: teardown,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeardownList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);

    const { projectId, status, assigneeId, page, pageSize } = req.query;

    const result = await TeardownService.getList(req.user, {
      projectId: projectId as string,
      status: status as TeardownStatus,
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

    const teardown = await TeardownService.getById(req.user, req.params.id);
    if (!teardown) throw new AppError('撤场复盘不存在', 404);

    const comment = await CommentService.addComment(
      req.user,
      'TeardownReview',
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

    const teardown = await TeardownService.getById(req.user, req.params.id);
    if (!teardown) throw new AppError('撤场复盘不存在', 404);

    const logs = await AuditService.getEntityLogs('TeardownReview', req.params.id);

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
