import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AuthRequest } from '../types';
import { error } from '../utils/response';

export function validateBody(schema: ZodSchema) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join(', ');
      return error(res, `请求参数错误: ${messages}`, 400);
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join(', ');
      return error(res, `查询参数错误: ${messages}`, 400);
    }

    req.query = result.data;
    next();
  };
}
