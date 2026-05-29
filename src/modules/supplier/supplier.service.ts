import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from './dto/supplier.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { QueryBuilderService } from '../../common/services/query-builder.service';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private queryBuilderService: QueryBuilderService,
  ) {}

  async create(createDto: CreateSupplierDto): Promise<Supplier> {
    const existing = await this.supplierRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new BusinessException(
        `Supplier with code ${createDto.code} already exists`,
        ErrorCode.DUPLICATE_RESOURCE,
      );
    }

    const supplier = this.supplierRepository.create(createDto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: SupplierQueryDto,
  ): Promise<PaginatedResponse<Supplier>> {
    const qb = this.supplierRepository.createQueryBuilder('supplier');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, ['name', 'code', 'contactPerson'], 'supplier');

    if (filters.isActive !== undefined) {
      qb.andWhere('supplier.isActive = :isActive', { isActive: filters.isActive });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'supplier');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: ['projects'],
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async findByCode(code: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { code } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with code ${code} not found`);
    }

    return supplier;
  }

  async update(id: string, updateDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, updateDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.softDelete ? 
      this.supplierRepository.softDelete(id) : 
      this.supplierRepository.delete(id);
  }
}
