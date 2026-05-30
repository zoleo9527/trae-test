import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export function success<T>(res: Response, data: T, message: string = '操作成功') {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(200).json(response);
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = '查询成功'
) {
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    message,
  };
  return res.status(200).json(response);
}

export function error(res: Response, message: string, statusCode: number = 400, error?: string) {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
}

export function unauthorized(res: Response, message: string = '未授权访问') {
  return error(res, message, 401);
}

export function forbidden(res: Response, message: string = '权限不足') {
  return error(res, message, 403);
}

export function notFound(res: Response, message: string = '资源不存在') {
  return error(res, message, 404);
}

export function serverError(res: Response, err: any) {
  console.error('Server Error:', err);
  return error(res, '服务器内部错误', 500, err.message);
}
