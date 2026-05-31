import { Request } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  traceId: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function success<T>(
  req: Request,
  data: T,
  message: string = '操作成功'
): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    traceId: req.context.traceId,
  };
}

export function successWithPagination<T>(
  req: Request,
  data: T,
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  },
  message: string = '查询成功'
): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    pagination,
    traceId: req.context.traceId,
  };
}

export function created<T>(
  req: Request,
  data: T,
  message: string = '创建成功'
): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    traceId: req.context.traceId,
  };
}
