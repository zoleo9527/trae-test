import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiseaseTimeline } from './disease-timeline.entity';
import { Disease, DiseaseSeverity, DiseaseStatus } from './disease.entity';
import { CreateDiseaseDto, CreateTimelineDto, QueryDiseaseDto, UpdateDiseaseStatusDto } from './dto/disease.dto';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(Disease)
    private readonly diseaseRepository: Repository<Disease>,
    @InjectRepository(DiseaseTimeline)
    private readonly timelineRepository: Repository<DiseaseTimeline>,
  ) {}

  async findAll(query?: QueryDiseaseDto): Promise<Disease[]> {
    const qb = this.diseaseRepository.createQueryBuilder('disease')
      .leftJoinAndSelect('disease.plot', 'plot')
      .leftJoinAndSelect('disease.reporter', 'reporter')
      .leftJoinAndSelect('disease.inspection', 'inspection')
      .leftJoinAndSelect('disease.timelines', 'timelines')
      .leftJoinAndSelect('timelines.operator', 'operator');

    if (query?.plotId) {
      qb.andWhere('disease.plotId = :plotId', { plotId: query.plotId });
    }
    if (query?.status) {
      qb.andWhere('disease.status = :status', { status: query.status });
    }
    if (query?.severity) {
      qb.andWhere('disease.severity = :severity', { severity: query.severity });
    }
    if (query?.type) {
      qb.andWhere('disease.type LIKE :type', { type: `%${query.type}%` });
    }
    if (query?.reporterId) {
      qb.andWhere('disease.reporterId = :reporterId', { reporterId: query.reporterId });
    }
    if (query?.startDate) {
      qb.andWhere('disease.reportedAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('disease.reportedAt <= :endDate', { endDate: query.endDate });
    }
    if (query?.isOverdue !== undefined) {
      qb.andWhere('disease.isOverdue = :isOverdue', { isOverdue: query.isOverdue });
    }

    qb.orderBy('disease.reportedAt', 'DESC');
    qb.addOrderBy('timelines.operatedAt', 'ASC');
    return qb.getMany();
  }

  async findOne(id: number): Promise<Disease> {
    return this.diseaseRepository.findOne({
      where: { id },
      relations: ['plot', 'reporter', 'inspection', 'timelines', 'timelines.operator', 'negotiations'],
    });
  }

  async create(dto: CreateDiseaseDto): Promise<Disease> {
    const disease = this.diseaseRepository.create({
      ...dto,
      status: dto.status ?? DiseaseStatus.REPORTED,
      reportedAt: new Date(dto.reportedAt),
    });
    const saved = await this.diseaseRepository.save(disease);

    await this.addTimeline({
      diseaseId: saved.id,
      operatorId: dto.reporterId,
      action: '上报病害',
      content: dto.description || `${dto.type}，${this.getSeverityText(dto.severity)}`,
      operatedAt: dto.reportedAt,
    });

    await this.checkOverdue(saved.id);

    return this.findOne(saved.id);
  }

  async updateStatus(id: number, dto: UpdateDiseaseStatusDto): Promise<Disease> {
    const disease = await this.findOne(id);
    if (!disease) {
      throw new BadRequestException('病害记录不存在');
    }

    const updateData: Partial<Disease> = { status: dto.status };
    const now = new Date();

    switch (dto.status) {
      case DiseaseStatus.CONFIRMED:
        updateData.confirmedAt = now;
        break;
      case DiseaseStatus.RESOLVED:
        updateData.resolvedAt = now;
        break;
    }

    await this.diseaseRepository.update(id, updateData);

    await this.addTimeline({
      diseaseId: id,
      operatorId: dto.operatorId,
      action: this.getStatusActionText(dto.status),
      content: dto.remark || '',
      operatedAt: now.toISOString(),
    });

    return this.findOne(id);
  }

  async addTimeline(dto: CreateTimelineDto): Promise<DiseaseTimeline> {
    const timeline = this.timelineRepository.create({
      ...dto,
      operatedAt: new Date(dto.operatedAt),
    });
    return this.timelineRepository.save(timeline);
  }

  async checkOverdue(id: number): Promise<void> {
    const disease = await this.findOne(id);
    if (!disease) return;

    const now = new Date();
    const reportedAt = new Date(disease.reportedAt);
    const diffDays = Math.floor((now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60 * 24));

    const overdueThreshold = disease.severity === DiseaseSeverity.MAJOR ? 1 : 3;

    if (diffDays > overdueThreshold && disease.status === DiseaseStatus.REPORTED) {
      await this.diseaseRepository.update(id, { isOverdue: true });
    }
  }

  async updateOverdueStatus(): Promise<void> {
    const diseases = await this.diseaseRepository.find({
      where: { status: DiseaseStatus.REPORTED, isOverdue: false },
    });

    for (const disease of diseases) {
      await this.checkOverdue(disease.id);
    }
  }

  private getSeverityText(severity: DiseaseSeverity): string {
    const map = {
      [DiseaseSeverity.MINOR]: '轻度',
      [DiseaseSeverity.MODERATE]: '中度',
      [DiseaseSeverity.MAJOR]: '重度',
    };
    return map[severity];
  }

  private getStatusActionText(status: DiseaseStatus): string {
    const map = {
      [DiseaseStatus.REPORTED]: '上报病害',
      [DiseaseStatus.CONFIRMED]: '确认病害',
      [DiseaseStatus.TREATING]: '开始处理',
      [DiseaseStatus.RESOLVED]: '处理完成',
    };
    return map[status];
  }
}
