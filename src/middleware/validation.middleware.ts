import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../lib/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
      {
        allowUnknown: true,
        abortEarly: false,
      }
    );

    if (error) {
      const errorMessages = error.details.map((d) => d.message).join(', ');
      logger.warn(`参数验证失败: ${errorMessages}`);
      return res.status(400).json({
        success: false,
        error: '参数验证失败',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    if (value.body) req.body = value.body;
    if (value.params) req.params = value.params;
    if (value.query) req.query = value.query;

    next();
  };
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  if (page < 1) {
    return res.status(400).json({
      success: false,
      error: '页码必须大于0',
    });
  }

  if (pageSize < 1 || pageSize > 100) {
    return res.status(400).json({
      success: false,
      error: '每页条数必须在1-100之间',
    });
  }

  (req as Request & { pagination: { page: number; pageSize: number; skip: number } }).pagination = {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };

  next();
};

export type PaginationRequest = Request & {
  pagination: {
    page: number;
    pageSize: number;
    skip: number;
  };
};
