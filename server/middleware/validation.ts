import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ErrorCodes, BusinessError } from '../types';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    let result;
    if (req.method === 'GET') {
      result = schema.safeParse(req.query);
      if (result.success) {
        req.query = result.data as unknown as Request['query'];
      }
    } else {
      result = schema.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      }
    }
    
    if (!result.success) {
      throw new BusinessError(
        ErrorCodes.VALIDATION_ERROR,
        '参数验证失败',
        result.error.issues
      );
    }
    next();
  };
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new BusinessError(
        ErrorCodes.VALIDATION_ERROR,
        '请求体参数验证失败',
        result.error.issues
      );
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new BusinessError(
        ErrorCodes.VALIDATION_ERROR,
        '查询参数验证失败',
        result.error.issues
      );
    }
    req.query = result.data as unknown as Request['query'];
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      throw new BusinessError(
        ErrorCodes.VALIDATION_ERROR,
        '路径参数验证失败',
        result.error.issues
      );
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}
