import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';
import { ErrorCodes, BusinessError } from '../types';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof BusinessError) {
    return sendError(res, err);
  }

  if (err instanceof ZodError) {
    const validationError = new BusinessError(
      ErrorCodes.VALIDATION_ERROR,
      '参数验证失败',
      err.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
    );
    return sendError(res, validationError);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const prismaError = new BusinessError(
        ErrorCodes.DUPLICATE_ERROR,
        '唯一约束冲突',
        { target: err.meta?.target, code: err.code }
      );
      return sendError(res, prismaError);
    }
    if (err.code === 'P2025') {
      const prismaError = new BusinessError(
        ErrorCodes.NOT_FOUND,
        '记录不存在',
        { code: err.code }
      );
      return sendError(res, prismaError);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const prismaError = new BusinessError(
      ErrorCodes.VALIDATION_ERROR,
      '数据库操作参数错误',
      { code: 'P2000' }
    );
    return sendError(res, prismaError);
  }

  console.error('[Global Error Handler]', err);
  return sendError(res, err);
};
