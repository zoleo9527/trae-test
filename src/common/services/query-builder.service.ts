import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, Brackets } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination.dto';

export interface FilterCondition {
  field: string;
  value: any;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
}

@Injectable()
export class QueryBuilderService {
  applyPagination<T>(
    qb: SelectQueryBuilder<T>,
    pagination: PaginationQueryDto,
  ): SelectQueryBuilder<T> {
    const skip = (pagination.page - 1) * pagination.pageSize;
    return qb.skip(skip).take(pagination.pageSize);
  }

  applySorting<T>(
    qb: SelectQueryBuilder<T>,
    pagination: PaginationQueryDto,
    alias: string,
  ): SelectQueryBuilder<T> {
    return qb.orderBy(`${alias}.${pagination.sortBy}`, pagination.sortOrder);
  }

  applyKeywordSearch<T>(
    qb: SelectQueryBuilder<T>,
    keyword: string,
    searchFields: string[],
    alias: string,
  ): SelectQueryBuilder<T> {
    if (!keyword) return qb;

    return qb.andWhere(
      new Brackets((qb) => {
        searchFields.forEach((field, index) => {
          const condition = `${alias}.${field} LIKE :keyword`;
          if (index === 0) {
            qb.where(condition, { keyword: `%${keyword}%` });
          } else {
            qb.orWhere(condition, { keyword: `%${keyword}%` });
          }
        });
      }),
    );
  }

  applyFilters<T>(
    qb: SelectQueryBuilder<T>,
    filters: FilterCondition[],
    alias: string,
  ): SelectQueryBuilder<T> {
    filters.forEach((filter) => {
      const { field, value, operator = 'eq' } = filter;

      switch (operator) {
        case 'eq':
          qb.andWhere(`${alias}.${field} = :${field}`, { [field]: value });
          break;
        case 'ne':
          qb.andWhere(`${alias}.${field} != :${field}`, { [field]: value });
          break;
        case 'gt':
          qb.andWhere(`${alias}.${field} > :${field}`, { [field]: value });
          break;
        case 'gte':
          qb.andWhere(`${alias}.${field} >= :${field}`, { [field]: value });
          break;
        case 'lt':
          qb.andWhere(`${alias}.${field} < :${field}`, { [field]: value });
          break;
        case 'lte':
          qb.andWhere(`${alias}.${field} <= :${field}`, { [field]: value });
          break;
        case 'like':
          qb.andWhere(`${alias}.${field} LIKE :${field}`, { [field]: `%${value}%` });
          break;
        case 'in':
          qb.andWhere(`${alias}.${field} IN (:...${field})`, { [field]: value });
          break;
      }
    });

    return qb;
  }
}
