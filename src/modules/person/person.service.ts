import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../../entities/person.entity';
import { CreatePersonDto, UpdatePersonDto, PersonQueryDto } from './dto/person.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { QueryBuilderService } from '../../common/services/query-builder.service';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    private queryBuilderService: QueryBuilderService,
  ) {}

  async create(createDto: CreatePersonDto): Promise<Person> {
    const existing = await this.personRepository.findOne({
      where: { idCardNo: createDto.idCardNo },
    });

    if (existing) {
      throw new BusinessException(
        `Person with ID card number ${createDto.idCardNo} already exists`,
        ErrorCode.DUPLICATE_RESOURCE,
      );
    }

    const person = this.personRepository.create(createDto);
    return this.personRepository.save(person);
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: PersonQueryDto,
  ): Promise<PaginatedResponse<Person>> {
    const qb = this.personRepository.createQueryBuilder('person')
      .leftJoinAndSelect('person.supplier', 'supplier');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, ['name', 'idCardNo', 'phone', 'position'], 'person');

    if (filters.type) {
      qb.andWhere('person.type = :type', { type: filters.type });
    }

    if (filters.supplierId) {
      qb.andWhere('person.supplierId = :supplierId', { supplierId: filters.supplierId });
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('person.isActive = :isActive', { isActive: filters.isActive });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'person');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['supplier', 'credentials', 'checkinRecords'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return person;
  }

  async findByIdCardNo(idCardNo: string): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { idCardNo },
      relations: ['supplier'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID card number ${idCardNo} not found`);
    }

    return person;
  }

  async update(id: string, updateDto: UpdatePersonDto): Promise<Person> {
    const person = await this.findOne(id);
    Object.assign(person, updateDto);
    return this.personRepository.save(person);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.personRepository.delete(id);
  }
}
