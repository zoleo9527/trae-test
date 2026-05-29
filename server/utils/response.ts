import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { ApiResponse, Pagination, ErrorCodes, BusinessError } from '../types';

export function success<T>(data: T, message = 'success', pagination?: Pagination): ApiResponse<T> {
  return {
    code: ErrorCodes.SUCCESS,
    message,
    data,
    timestamp: Date.now(),
    requestId: uuidv4(),
    pagination,
  };
}

export function error(code: number, message: string, details?: unknown): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now(),
    requestId: uuidv4(),
  };
}

export function sendSuccess<T>(res: Response, data: T, message = 'success', pagination?: Pagination): Response {
  return res.json(success(data, message, pagination));
}

export function sendError(res: Response, err: unknown): Response {
  if (err instanceof BusinessError) {
    return res.status(err.code >= 50000 ? 500 : 400).json(
      error(err.code, err.message, err.details)
    );
  }
  
  if (err instanceof Error) {
    console.error('[Unhandled Error]', err);
    return res.status(500).json(
      error(ErrorCodes.BUSINESS_ERROR, err.message)
    );
  }
  
  return res.status(500).json(
    error(ErrorCodes.BUSINESS_ERROR, 'Internal Server Error')
  );
}

export function calculatePagination(total: number, page: number, pageSize: number): Pagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
