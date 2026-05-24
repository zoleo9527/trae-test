import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { AppError } from './errorHandler';

interface ValidationSchemas {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: Array<{ field: string; message: string }> = [];

    if (schemas.body) {
      const { error } = schemas.body.validate(req.body, { abortEarly: false });
      if (error) {
        error.details.forEach(d => {
          errors.push({
            field: `body.${d.path.join('.')}`,
            message: d.message
          });
        });
      }
    }

    if (schemas.query) {
      const { error } = schemas.query.validate(req.query, { abortEarly: false });
      if (error) {
        error.details.forEach(d => {
          errors.push({
            field: `query.${d.path.join('.')}`,
            message: d.message
          });
        });
      }
    }

    if (schemas.params) {
      const { error } = schemas.params.validate(req.params, { abortEarly: false });
      if (error) {
        error.details.forEach(d => {
          errors.push({
            field: `params.${d.path.join('.')}`,
            message: d.message
          });
        });
      }
    }

    if (errors.length > 0) {
      return next(new AppError('参数验证失败', 'VALIDATION_ERROR', 400, errors));
    }

    next();
  };
};
