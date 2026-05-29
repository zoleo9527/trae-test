import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Credential } from '../../../entities/credential.entity';
import { CredentialStatus, CredentialStatusTransitions, CredentialType } from '../../../common/enums/credential.enum';
import {
  CreateCredentialDto,
  UpdateCredentialDto,
  UpdateCredentialStatusDto,
  CredentialQueryDto,
} from './dto/credential.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../../common/dto/response.dto';
import { QueryBuilderService } from '../../../common/services/query-builder.service';
import { StateMachineService } from '../../../common/services/state-machine.service';
import { BusinessException, ErrorCode } from '../../../common/filters/http-exception.filter';

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    private queryBuilderService: QueryBuilderService,
    private stateMachineService: StateMachineService,
  ) {}

  generateCredentialNo(type: CredentialType): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async create(createDto: CreateCredentialDto): Promise<Credential> {
    const credential = this.credentialRepository.create({
      ...createDto,
      credentialNo: this.generateCredentialNo(createDto.type),
      status: CredentialStatus.DRAFT,
    });

    return this.credentialRepository.save(credential);
  }

  async batchCreate(projectId: string, personIds: string[], type: CredentialType): Promise<Credential[]> {
    const credentials: Credential[] = [];

    for (const personId of personIds) {
      const existing = await this.credentialRepository.findOne({
        where: { projectId, personId, type },
      });

      if (!existing) {
        const credential = this.credentialRepository.create({
          projectId,
          personId,
          type,
          credentialNo: this.generateCredentialNo(type),
          status: CredentialStatus.DRAFT,
        });
        credentials.push(credential);
      }
    }

    return this.credentialRepository.save(credentials);
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: CredentialQueryDto,
  ): Promise<PaginatedResponse<Credential>> {
    const qb = this.credentialRepository.createQueryBuilder('credential')
      .leftJoinAndSelect('credential.project', 'project')
      .leftJoinAndSelect('credential.person', 'person');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, ['credentialNo'], 'credential');

    if (filters.projectId) {
      qb.andWhere('credential.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.personId) {
      qb.andWhere('credential.personId = :personId', { personId: filters.personId });
    }

    if (filters.type) {
      qb.andWhere('credential.type = :type', { type: filters.type });
    }

    if (filters.status) {
      qb.andWhere('credential.status = :status', { status: filters.status });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'credential');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
      where: { id },
      relations: ['project', 'person', 'checkinRecords', 'statusLogs'],
    });

    if (!credential) {
      throw new NotFoundException(`Credential with ID ${id} not found`);
    }

    return credential;
  }

  async update(id: string, updateDto: UpdateCredentialDto): Promise<Credential> {
    const credential = await this.findOne(id);

    if (credential.status !== CredentialStatus.DRAFT && credential.status !== CredentialStatus.REJECTED) {
      throw new BusinessException(
        'Can only update credential in DRAFT or REJECTED status',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    Object.assign(credential, updateDto);
    return this.credentialRepository.save(credential);
  }

  async updateStatus(
    id: string,
    statusDto: UpdateCredentialStatusDto,
  ): Promise<Credential> {
    const credential = await this.findOne(id);

    this.stateMachineService.ensureValidTransition(
      credential.status,
      statusDto.status,
      CredentialStatusTransitions,
      'credential',
    );

    if (credential.status !== statusDto.status) {
      await this.stateMachineService.logStatusChange(
        'credential',
        credential.id,
        credential.status,
        statusDto.status,
        statusDto.operator,
        statusDto.reviewRemark,
        credential.projectId,
      );
    }

    credential.status = statusDto.status;

    if (statusDto.reviewRemark) {
      credential.reviewRemark = statusDto.reviewRemark;
    }

    if (statusDto.status === CredentialStatus.APPROVED || statusDto.status === CredentialStatus.REJECTED) {
      credential.reviewer = statusDto.operator;
      credential.reviewedAt = new Date();
    }

    if (statusDto.status === CredentialStatus.ISSUED) {
      credential.issuer = statusDto.operator;
      credential.issuedAt = new Date();
    }

    return this.credentialRepository.save(credential);
  }

  async getStatusHistory(id: string): Promise<any[]> {
    return this.stateMachineService.getStatusHistory('credential', id);
  }

  async getCredentialStats(projectId?: string): Promise<any> {
    const qb = this.credentialRepository
      .createQueryBuilder('credential')
      .select([
        'credential.status as status',
        'COUNT(*) as count',
      ]);

    if (projectId) {
      qb.where('credential.projectId = :projectId', { projectId });
    }

    const stats = await qb
      .groupBy('credential.status')
      .getRawMany();

    const result: Record<string, number> = {};
    Object.values(CredentialStatus).forEach((status) => {
      result[status] = 0;
    });

    stats.forEach((stat) => {
      result[stat.status] = parseInt(stat.count, 10);
    });

    return result;
  }

  async remove(id: string): Promise<void> {
    const credential = await this.findOne(id);

    if (credential.status !== CredentialStatus.DRAFT) {
      throw new BusinessException(
        'Can only delete credential in DRAFT status',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    await this.credentialRepository.delete(id);
  }
}
