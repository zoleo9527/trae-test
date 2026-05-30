import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  const response: ApiResponse = {
    success: false,
    message: err.message || '服务器内部错误',
    code: 500
  };

  if (err.name === 'ValidationError') {
    response.code = 400;
    res.status(400).json(response);
  } else if (err.name === 'UnauthorizedError') {
    response.code = 401;
    res.status(401).json(response);
  } else if (err.name === 'ForbiddenError') {
    response.code = 403;
    res.status(403).json(response);
  } else if (err.name === 'NotFoundError') {
    response.code = 404;
    response.message = '资源不存在';
    res.status(404).json(response);
  } else {
    res.status(500).json(response);
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    code: 404
  });
}
