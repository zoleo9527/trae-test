import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyReport } from './entities/daily-report.entity';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { User } from '../user/entities/user.entity';
import { AuditService, AuditAction, AuditEntityType } from '../audit/audit.service';

@Injectable()
export class DailyReportService {
  constructor(
    @InjectRepository(DailyReport)
    private dailyReportRepository: Repository<DailyReport>,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateDailyReportDto, user: User): Promise<DailyReport> {
    const report = this.dailyReportRepository.create({
      ...createDto,
      createdById: user.id,
      createdBy: user,
    });

    const saved = await this.dailyReportRepository.save(report);

    await this.auditService.createLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.DAILY_REPORT,
      entityId: saved.id,
      entityName: `日报-${saved.reportDate}`,
      user,
      newValues: saved,
      description: '创建施工日报',
    });

    return this.findOne(saved.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      projectId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{ data: DailyReport[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.dailyReportRepository.createQueryBuilder('dr')
      .leftJoinAndSelect('dr.createdBy', 'createdBy')
      .leftJoinAndSelect('dr.changeOrder', 'changeOrder');

    if (filters?.projectId) {
      queryBuilder.andWhere('dr.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('dr.reportDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('dr.reportDate <= :endDate', { endDate: filters.endDate });
    }

    const [data, total] = await queryBuilder
      .orderBy('dr.reportDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<DailyReport> {
    const report = await this.dailyReportRepository.findOne({
      where: { id },
      relations: ['createdBy', 'changeOrder', 'signOffs'],
    });

    if (!report) {
      throw new NotFoundException('施工日报不存在');
    }

    return report;
  }

  async update(id: string, updateDto: UpdateDailyReportDto, user: User): Promise<DailyReport> {
    const report = await this.findOne(id);
    const oldValues = { ...report };

    Object.assign(report, updateDto);
    const saved = await this.dailyReportRepository.save(report);

    await this.auditService.createLog({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.DAILY_REPORT,
      entityId: id,
      entityName: `日报-${saved.reportDate}`,
      user,
      oldValues,
      newValues: saved,
      description: '更新施工日报',
    });

    return this.findOne(id);
  }

  async findByChangeOrder(changeOrderId: string): Promise<DailyReport[]> {
    return this.dailyReportRepository.find({
      where: { changeOrderId },
      relations: ['createdBy'],
      order: { reportDate: 'DESC' },
    });
  }
}
