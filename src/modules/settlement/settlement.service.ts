import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from '../../../entities/settlement.entity';
import { SettlementStatus, SettlementStatusTransitions } from '../../../common/enums/settlement.enum';
import {
  CreateSettlementDto,
  UpdateSettlementDto,
  UpdateSettlementStatusDto,
  SupplierConfirmDto,
  SettlementQueryDto,
} from './dto/settlement.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../../common/dto/response.dto';
import { QueryBuilderService } from '../../../common/services/query-builder.service';
import { StateMachineService } from '../../../common/services/state-machine.service';
import { BusinessException, ErrorCode } from '../../../common/filters/http-exception.filter';

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    private queryBuilderService: QueryBuilderService,
    private stateMachineService: StateMachineService,
  ) {}

  generateSettlementNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SET-${date}-${random}`;
  }

  async create(createDto: CreateSettlementDto): Promise<Settlement> {
    const settlement = this.settlementRepository.create({
      ...createDto,
      settlementNo: this.generateSettlementNo(),
      status: SettlementStatus.DRAFT,
      confirmedAmount: createDto.contractAmount,
    });

    return this.settlementRepository.save(settlement);
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: SettlementQueryDto,
  ): Promise<PaginatedResponse<Settlement>> {
    const qb = this.settlementRepository.createQueryBuilder('settlement')
      .leftJoinAndSelect('settlement.project', 'project')
      .leftJoinAndSelect('settlement.supplier', 'supplier');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, ['settlementNo'], 'settlement');

    if (filters.projectId) {
      qb.andWhere('settlement.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.supplierId) {
      qb.andWhere('settlement.supplierId = :supplierId', { supplierId: filters.supplierId });
    }

    if (filters.status) {
      qb.andWhere('settlement.status = :status', { status: filters.status });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'settlement');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ['project', 'supplier', 'statusLogs'],
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement with ID ${id} not found`);
    }

    return settlement;
  }

  async update(id: string, updateDto: UpdateSettlementDto): Promise<Settlement> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.DRAFT && settlement.status !== SettlementStatus.AUDIT_REJECTED) {
      throw new BusinessException(
        'Can only update settlement in DRAFT or AUDIT_REJECTED status',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    Object.assign(settlement, updateDto);
    return this.settlementRepository.save(settlement);
  }

  async supplierConfirm(id: string, confirmDto: SupplierConfirmDto): Promise<Settlement> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.PENDING_CONFIRM) {
      throw new BusinessException(
        'Settlement is not pending supplier confirmation',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    await this.stateMachineService.logStatusChange(
      'settlement',
      settlement.id,
      settlement.status,
      SettlementStatus.SUPPLIER_CONFIRMED,
      'supplier',
      confirmDto.supplierRemark,
      settlement.projectId,
    );

    settlement.status = SettlementStatus.SUPPLIER_CONFIRMED;
    settlement.confirmedAmount = confirmDto.confirmedAmount;
    settlement.supplierRemark = confirmDto.supplierRemark;
    settlement.supplierConfirmedAt = new Date();

    return this.settlementRepository.save(settlement);
  }

  async updateStatus(
    id: string,
    statusDto: UpdateSettlementStatusDto,
  ): Promise<Settlement> {
    const settlement = await this.findOne(id);

    this.stateMachineService.ensureValidTransition(
      settlement.status,
      statusDto.status,
      SettlementStatusTransitions,
      'settlement',
    );

    if (settlement.status !== statusDto.status) {
      await this.stateMachineService.logStatusChange(
        'settlement',
        settlement.id,
        settlement.status,
        statusDto.status,
        statusDto.operator,
        statusDto.remark,
        settlement.projectId,
      );
    }

    settlement.status = statusDto.status;

    if (statusDto.status === SettlementStatus.AUDIT_PASSED || statusDto.status === SettlementStatus.AUDIT_REJECTED) {
      settlement.auditor = statusDto.operator;
      settlement.auditedAt = new Date();
      settlement.auditRemark = statusDto.remark;
      if (statusDto.auditAmount) {
        settlement.auditAmount = statusDto.auditAmount;
      }
    }

    if (statusDto.status === SettlementStatus.PAYMENT_SCHEDULED && statusDto.expectedPaymentDate) {
      settlement.expectedPaymentDate = new Date(statusDto.expectedPaymentDate);
    }

    if (statusDto.status === SettlementStatus.PAID) {
      settlement.actualPaymentDate = new Date();
      settlement.actualPaidAmount = settlement.auditAmount || settlement.confirmedAmount;
    }

    return this.settlementRepository.save(settlement);
  }

  async getStatusHistory(id: string): Promise<any[]> {
    return this.stateMachineService.getStatusHistory('settlement', id);
  }

  async getSettlementStats(projectId?: string): Promise<any> {
    const qb = this.settlementRepository
      .createQueryBuilder('settlement')
      .select([
        'settlement.status as status',
        'COUNT(*) as count',
        'SUM(COALESCE(settlement.auditAmount, settlement.confirmedAmount, settlement.contractAmount)) as totalAmount',
      ]);

    if (projectId) {
      qb.where('settlement.projectId = :projectId', { projectId });
    }

    const stats = await qb
      .groupBy('settlement.status')
      .getRawMany();

    const result: Record<string, { count: number; amount: number }> = {};
    Object.values(SettlementStatus).forEach((status) => {
      result[status] = { count: 0, amount: 0 };
    });

    stats.forEach((stat) => {
      result[stat.status] = {
        count: parseInt(stat.count, 10),
        amount: parseFloat(stat.totalamount || 0),
      };
    });

    return result;
  }

  async remove(id: string): Promise<void> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.DRAFT) {
      throw new BusinessException(
        'Can only delete settlement in DRAFT status',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    await this.settlementRepository.delete(id);
  }
}
