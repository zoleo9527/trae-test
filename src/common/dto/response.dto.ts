export class ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: number;

  constructor(data: T, message = 'success') {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = Date.now();
  }
}

export class PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  constructor(items: T[], total: number, page: number, pageSize: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface FilterParams {
  [key: string]: any;
}

export interface SortParams {
  field: string;
  order: 'ASC' | 'DESC';
}
