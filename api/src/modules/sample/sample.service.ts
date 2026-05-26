import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SampleLoan, SampleLoanStatus } from '../../entities/sample-loan.entity';
import { CreateSampleLoanDto, UpdateSampleLoanDto } from './sample.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class SampleService {
  constructor(
    @InjectRepository(SampleLoan)
    private readonly sampleLoanRepository: Repository<SampleLoan>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    status?: SampleLoanStatus,
    customerName?: string,
  ): Promise<PaginatedResult<SampleLoan>> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (customerName) {
      where.customerName = customerName;
    }

    const [items, total] = await this.sampleLoanRepository.findAndCount({
      where,
      relations: ['product', 'order'],
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async getOverdueSamples(): Promise<SampleLoan[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.sampleLoanRepository
      .createQueryBuilder('loan')
      .where('loan.status = :status', { status: SampleLoanStatus.BORROWED })
      .andWhere('loan.expectedReturnDate < :today', { today })
      .orWhere('loan.status = :overdueStatus', { overdueStatus: SampleLoanStatus.OVERDUE })
      .leftJoinAndSelect('loan.product', 'product')
      .leftJoinAndSelect('loan.order', 'order')
      .orderBy('loan.expectedReturnDate', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<SampleLoan> {
    return this.sampleLoanRepository.findOne({
      where: { id },
      relations: ['product', 'order'],
    });
  }

  async create(dto: CreateSampleLoanDto, operator: string): Promise<SampleLoan> {
    const loan = this.sampleLoanRepository.create(dto);
    const saved = await this.sampleLoanRepository.save(loan);

    await this.activityLogService.log(
      'sample_loan',
      saved.id,
      'create',
      `借出样品: ${dto.productName} 给 ${dto.customerName}`,
      operator,
      dto.handledBy || 'sales',
      null,
      saved,
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateSampleLoanDto, operator: string): Promise<SampleLoan> {
    const loan = await this.findOne(id);
    const oldValue = { ...loan };

    if (dto.status === SampleLoanStatus.RETURNED && !loan.actualReturnDate) {
      loan.actualReturnDate = new Date().toISOString().split('T')[0];
    }

    Object.assign(loan, dto);
    const updated = await this.sampleLoanRepository.save(loan);

    const statusMap = {
      [SampleLoanStatus.BORROWED]: '借出中',
      [SampleLoanStatus.RETURNED]: '已归还',
      [SampleLoanStatus.OVERDUE]: '逾期',
      [SampleLoanStatus.LOST]: '遗失',
      [SampleLoanStatus.KEPT_BY_CUSTOMER]: '客户留购',
    };

    await this.activityLogService.log(
      'sample_loan',
      id,
      'update',
      `样品状态更新: ${statusMap[updated.status]}`,
      operator,
      'sales',
      oldValue,
      updated,
    );

    return updated;
  }

  async sendReminder(id: number, message?: string): Promise<SampleLoan> {
    const loan = await this.findOne(id);
    loan.reminderCount += 1;
    loan.lastReminderAt = new Date();

    if (message) {
      loan.followUpNotes = (loan.followUpNotes || '') + '\n' + `[提醒 ${loan.reminderCount}] ${message}`;
    }

    const updated = await this.sampleLoanRepository.save(loan);

    await this.activityLogService.log(
      'sample_loan',
      id,
      'reminder',
      `发送催还提醒 (第 ${loan.reminderCount} 次)`,
      'system',
      'sales',
      null,
      updated,
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const loan = await this.findOne(id);
    await this.sampleLoanRepository.delete(id);

    await this.activityLogService.log(
      'sample_loan',
      id,
      'delete',
      `删除样品记录: ${loan.productName} - ${loan.customerName}`,
      operator,
      'manager',
      loan,
      null,
    );
  }
}
