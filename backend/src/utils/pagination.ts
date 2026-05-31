import { Request } from 'express';
import { config } from '../config';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function parsePagination(req: Request): PaginationParams {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize =
    parseInt(req.query.pageSize as string) || config.pagination.defaultPageSize;

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(
    Math.max(1, pageSize),
    config.pagination.maxPageSize
  );

  return {
    page: safePage,
    pageSize: safePageSize,
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}

export function createPaginationResult<T>(
  items: T[],
  total: number,
  pagination: PaginationParams
): PaginationResult<T> {
  const totalPages = Math.ceil(total / pagination.pageSize);
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrev: pagination.page > 1,
  };
}
