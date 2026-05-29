import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`[${req.method}] ${req.path} - ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: '参数验证失败',
      details: err.errors,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: '资源不存在',
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: '数据冲突，唯一约束违反',
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`找不到 ${req.method} ${req.path} 路由`, 404));
};
