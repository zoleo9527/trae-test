import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ProjectStatus, AuditAction, Role } from '../types';
import { ProjectService } from '../services/project.service';
import { AppError } from '../middleware/errorHandler';

import { CommentService } from '../services/comment.service';
import { AuditService } from '../services/audit.service';
import prisma from '../lib/prisma';

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const project = await ProjectService.create(req.user, req.body, req.ip);
    
    res.status(201).json({
      success: true,
      data: project,
      message: '项目创建成功',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const project = await ProjectService.update(req.user, req.params.id, req.body, req.ip);
    
    res.json({
      success: true,
      data: project,
      message: '项目更新成功',
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const project = await ProjectService.getById(req.user, req.params.id);
    if (!project) throw new AppError('项目不存在', 404);
    
    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { status, page, pageSize } = req.query;
    
    const result = await ProjectService.getList(req.user, {
      status: status as ProjectStatus,
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

export const addSupplier = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const { supplierId, contractAmount, scope } = req.body;
    if (!supplierId) throw new AppError('请选择供应商', 400);
    
    const projectSupplier = await ProjectService.addSupplier(
      req.user,
      req.params.id,
      supplierId,
      contractAmount,
      scope,
      req.ip
    );
    
    res.status(201).json({
      success: true,
      data: projectSupplier,
      message: '供应商添加成功',
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    
    res.json({
      success: true,
      data: suppliers,
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

    const project = await ProjectService.getById(req.user, req.params.id);
    if (!project) throw new AppError('项目不存在', 404);

    const comment = await CommentService.addComment(
      req.user,
      'Project',
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

export const getDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('未认证', 401);
    
    const stats = await ProjectService.getDashboardStats(req.user);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
