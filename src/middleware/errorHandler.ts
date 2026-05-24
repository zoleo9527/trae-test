import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number = 400, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId
    });
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: '服务器内部错误',
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId
  });
};
