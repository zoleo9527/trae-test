import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, PaymentStatus, AuditAction } from '../types';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../middleware/errorHandler';

import { CommentService } from '../services/comment.service';
import { AuditService } from '../services/audit.service';

export const createPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const payment = await PaymentService.create(req.user, req.body, req.ip);
    
    res.status(201).json({
      success: true,
      data: payment,
      message: '付款申请创建成功',
    });
  } catch (error) {
    next(error);
  }
};

export const approvePayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const payment = await PaymentService.approve(req.user, req.params.id, req.ip);
    
    res.json({
      success: true,
      data: payment,
      message: '付款申请审批通过',
    });
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { payDate } = req.body;
    const payment = await PaymentService.markPaid(
      req.user,
      req.params.id,
      payDate ? new Date(payDate) : undefined,
      req.ip
    );
    
    res.json({
      success: true,
      data: payment,
      message: '付款已完成',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { reason } = req.body;
    if (!reason) throw new AppError('请填写驳回原因', 400);
    
    const payment = await PaymentService.reject(
      req.user,
      req.params.id,
      reason,
      req.ip
    );
    
    res.json({
      success: true,
      data: payment,
      message: '付款申请已驳回',
    });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const payment = await PaymentService.getById(req.user, req.params.id);
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { projectId, reconciliationId, status, page, pageSize } = req.query;
    
    const result = await PaymentService.getList(req.user, {
      projectId: projectId as string,
      reconciliationId: reconciliationId as string,
      status: status as PaymentStatus,
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
    
    const comment = await CommentService.addComment(
      req.user,
      'Payment',
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
    
    const logs = await AuditService.getEntityLogs('Payment', req.params.id);
    
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
