import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate({
      body: req.body,
      query: req.query,
      params: req.params
    }, { abortEarly: false });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      throw new AppError('参数验证失败', 'VALIDATION_ERROR', 400, details);
    }

    next();
  };
};
