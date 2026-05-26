import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    keyword?: string,
  ): Promise<PaginatedResult<Customer>> {
    const where = keyword
      ? [{ name: Like(`%${keyword}%`) }, { phone: Like(`%${keyword}%`) }]
      : {};

    const [items, total] = await this.customerRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: number): Promise<Customer> {
    return this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });
  }

  async create(dto: CreateCustomerDto, operator: string): Promise<Customer> {
    const customer = this.customerRepository.create(dto);
    const saved = await this.customerRepository.save(customer);

    await this.activityLogService.log(
      'customer',
      saved.id,
      'create',
      `创建客户: ${saved.name}`,
      operator,
      'sales',
      null,
      saved,
    );

    return saved;
  }

  async update(id: number, dto: UpdateCustomerDto, operator: string): Promise<Customer> {
    const customer = await this.findOne(id);
    const oldValue = { ...customer };
    Object.assign(customer, dto);
    const updated = await this.customerRepository.save(customer);

    await this.activityLogService.log(
      'customer',
      id,
      'update',
      `更新客户信息: ${customer.name}`,
      operator,
      'sales',
      oldValue,
      updated,
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.delete(id);

    await this.activityLogService.log(
      'customer',
      id,
      'delete',
      `删除客户: ${customer.name}`,
      operator,
      'manager',
      customer,
      null,
    );
  }
}
