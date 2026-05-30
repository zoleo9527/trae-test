import { Request, Response } from 'express';
import * as exceptionService from '../services/exception';
import { CreateExceptionRequest, ExceptionFilters, ProcessExceptionRequest } from '../services/exception';

export async function getExceptions(req: Request, res: Response) {
  const filters: ExceptionFilters = {
    member_id: req.query.member_id ? parseInt(req.query.member_id as string) : undefined,
    member_name_like: req.query.member_name_like as string,
    type: req.query.type as string,
    status: req.query.status as string,
    created_by: req.query.created_by ? parseInt(req.query.created_by as string) : undefined,
    handled_by: req.query.handled_by ? parseInt(req.query.handled_by as string) : undefined,
    created_at_start: req.query.created_at_start as string,
    created_at_end: req.query.created_at_end as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  };

  const result = exceptionService.getExceptions(filters);
  res.json({
    success: true,
    message: '获取成功',
    data: result
  });
}

export async function getExceptionById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const exception = exceptionService.getExceptionDetailById(id);

  if (!exception) {
    return res.status(404).json({
      success: false,
      message: '异常工单不存在'
    });
  }

  res.json({
    success: true,
    message: '获取成功',
    data: exception
  });
}

export async function createException(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const data: CreateExceptionRequest = req.body;

  if (!data.type || !data.title || !data.description) {
    return res.status(400).json({
      success: false,
      message: '异常类型、标题和描述不能为空'
    });
  }

  try {
    const exceptionId = exceptionService.createException(req, req.user.userId, data);
    res.json({
      success: true,
      message: '创建成功',
      data: { exception_id: exceptionId }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}

export async function processException(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const id = parseInt(req.params.id);
  const data: ProcessExceptionRequest = req.body;

  if (!data.status || !data.handling_result) {
    return res.status(400).json({
      success: false,
      message: '处理状态和处理结果不能为空'
    });
  }

  try {
    const exception = exceptionService.processException(req, req.user.userId, id, data);
    res.json({
      success: true,
      message: '处理成功',
      data: exception
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
}
