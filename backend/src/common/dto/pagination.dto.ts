export class PaginationDto {
  page?: number = 1;
  limit?: number = 20;
}

export class PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
