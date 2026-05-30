'use client';

import { PaginatedResponse } from '@/types';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginatedResponse<T>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  emptyText?: string;
  highlightRows?: (row: T) => boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  onRowClick,
  rowClassName,
  emptyText = '暂无数据',
  highlightRows,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort(key, newDirection);
  };

  const renderCell = (row: T, column: Column<T>, index: number) => {
    if (column.render) {
      return column.render(row, index);
    }
    return row[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`table-header ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} ${
                    column.fixed === 'left' ? 'sticky left-0 bg-gray-50 z-10' : ''
                  } ${column.fixed === 'right' ? 'sticky right-0 bg-gray-50 z-10' : ''}`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="inline-flex items-center gap-1 hover:text-primary-600 transition-colors"
                    >
                      {column.title}
                      <span className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={sortKey === column.key && sortDirection === 'asc' ? 'text-primary-600' : 'text-gray-300'}
                        />
                        <ChevronDown
                          size={12}
                          className={sortKey === column.key && sortDirection === 'desc' ? 'text-primary-600' : 'text-gray-300'}
                        />
                      </span>
                    </button>
                  ) : (
                    column.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => {
              const isHighlighted = highlightRows?.(row);
              return (
                <tr
                  key={index}
                  className={`
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-primary-50' : ''}
                    ${isHighlighted ? 'bg-red-50 hover:bg-red-100' : index % 2 === 1 ? 'bg-gray-50/50' : ''}
                    ${rowClassName?.(row, index) || ''}
                  `}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`table-cell ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} ${
                        column.fixed === 'left' ? 'sticky left-0 bg-inherit z-10' : ''
                      } ${column.fixed === 'right' ? 'sticky right-0 bg-inherit z-10' : ''}`}
                    >
                      {renderCell(row, column, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              共 <span className="font-medium text-gray-900">{pagination.total}</span> 条
            </span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
              className="input-field text-sm py-1 w-24"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
