import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import { Prisma } from '@prisma/client';

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

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new AppError(`未找到路由: ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.path} - ${error.message}`, error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || '未知字段';
      return res.status(409).json({
        success: false,
        error: `数据冲突: ${target} 已存在`,
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '记录不存在',
      });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: '关联数据不存在，请检查外键约束',
      });
    }
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: '请求体JSON格式错误',
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
};
