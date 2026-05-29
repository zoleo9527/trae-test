import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInspectionDto, QueryInspectionDto } from './dto/inspection.dto';
import { Inspection, InspectionStatus } from './inspection.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private readonly inspectionRepository: Repository<Inspection>,
  ) {}

  async findAll(query?: QueryInspectionDto): Promise<Inspection[]> {
    const qb = this.inspectionRepository.createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.plot', 'plot')
      .leftJoinAndSelect('inspection.inspector', 'inspector')
      .leftJoinAndSelect('inspection.disease', 'disease');

    if (query?.plotId) {
      qb.andWhere('inspection.plotId = :plotId', { plotId: query.plotId });
    }
    if (query?.inspectorId) {
      qb.andWhere('inspection.inspectorId = :inspectorId', { inspectorId: query.inspectorId });
    }
    if (query?.status) {
      qb.andWhere('inspection.status = :status', { status: query.status });
    }
    if (query?.hasDisease !== undefined) {
      qb.andWhere('inspection.hasDisease = :hasDisease', { hasDisease: query.hasDisease });
    }
    if (query?.startDate) {
      qb.andWhere('inspection.inspectionDate >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('inspection.inspectionDate <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('inspection.inspectionDate', 'DESC');
    return qb.getMany();
  }

  async findOne(id: number): Promise<Inspection> {
    return this.inspectionRepository.findOne({
      where: { id },
      relations: ['plot', 'inspector', 'disease'],
    });
  }

  async create(dto: CreateInspectionDto): Promise<Inspection> {
    const inspection = this.inspectionRepository.create({
      ...dto,
      status: dto.status ?? InspectionStatus.PENDING,
      hasDisease: dto.hasDisease ?? false,
    });
    return this.inspectionRepository.save(inspection);
  }

  async complete(id: number, dto: Partial<CreateInspectionDto>): Promise<Inspection> {
    await this.inspectionRepository.update(id, {
      ...dto,
      status: InspectionStatus.COMPLETED,
    });
    return this.findOne(id);
  }
}
