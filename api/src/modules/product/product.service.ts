import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    keyword?: string,
    category?: string,
    isSample?: boolean,
  ): Promise<PaginatedResult<Product>> {
    const where: any = {};
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    if (category) {
      where.category = category;
    }
    if (isSample !== undefined) {
      where.isSample = isSample;
    }

    const [items, total] = await this.productRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findOneBy({ id });
  }

  async create(dto: CreateProductDto, operator: string): Promise<Product> {
    const product = this.productRepository.create(dto);
    const saved = await this.productRepository.save(product);

    await this.activityLogService.log(
      'product',
      saved.id,
      'create',
      `创建产品: ${saved.name}`,
      operator,
      'manager',
      null,
      saved,
    );

    return saved;
  }

  async update(id: number, dto: UpdateProductDto, operator: string): Promise<Product> {
    const product = await this.findOne(id);
    const oldValue = { ...product };
    Object.assign(product, dto);
    const updated = await this.productRepository.save(product);

    await this.activityLogService.log(
      'product',
      id,
      'update',
      `更新产品: ${product.name}`,
      operator,
      'manager',
      oldValue,
      updated,
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.delete(id);

    await this.activityLogService.log(
      'product',
      id,
      'delete',
      `删除产品: ${product.name}`,
      operator,
      'manager',
      product,
      null,
    );
  }
}
