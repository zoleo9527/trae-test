import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly code: number;
  public readonly details?: any;

  constructor(code: number, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, details);
    this.name = 'ConflictError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[${req.context.traceId}] Error:`, err);

  if (err instanceof AppError) {
    return res.status(err.code).json({
      code: err.code,
      message: err.message,
      details: err.details,
      traceId: req.context.traceId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      traceId: req.context.traceId,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        code: 409,
        message: '数据冲突，唯一约束违反',
        details: prismaError.meta?.target,
        traceId: req.context.traceId,
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        code: 404,
        message: '记录不存在',
        traceId: req.context.traceId,
      });
    }
  }

  res.status(500).json({
    code: 500,
    message:
      process.env.NODE_ENV === 'production'
        ? '服务器内部错误'
        : err.message,
    traceId: req.context.traceId,
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.path}`,
    traceId: req.context.traceId,
  });
}
