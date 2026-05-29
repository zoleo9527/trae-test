import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiseaseService } from '../disease/disease.service';
import { CreateNegotiationDto, QueryNegotiationDto, UpdateNegotiationStatusDto } from './dto/negotiation.dto';
import { Negotiation, NegotiationStatus } from './negotiation.entity';

@Injectable()
export class NegotiationService {
  constructor(
    @InjectRepository(Negotiation)
    private readonly negotiationRepository: Repository<Negotiation>,
    private readonly diseaseService: DiseaseService,
  ) {}

  async findAll(query?: QueryNegotiationDto): Promise<Negotiation[]> {
    const qb = this.negotiationRepository.createQueryBuilder('negotiation')
      .leftJoinAndSelect('negotiation.disease', 'disease')
      .leftJoinAndSelect('disease.plot', 'plot')
      .leftJoinAndSelect('negotiation.initiator', 'initiator')
      .leftJoinAndSelect('negotiation.confirmedBy', 'confirmedBy');

    if (query?.diseaseId) {
      qb.andWhere('negotiation.diseaseId = :diseaseId', { diseaseId: query.diseaseId });
    }
    if (query?.status) {
      qb.andWhere('negotiation.status = :status', { status: query.status });
    }
    if (query?.initiatorId) {
      qb.andWhere('negotiation.initiatorId = :initiatorId', { initiatorId: query.initiatorId });
    }
    if (query?.startDate) {
      qb.andWhere('negotiation.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('negotiation.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('negotiation.createdAt', 'DESC');
    return qb.getMany();
  }

  async findOne(id: number): Promise<Negotiation> {
    return this.negotiationRepository.findOne({
      where: { id },
      relations: ['disease', 'disease.plot', 'initiator', 'confirmedBy'],
    });
  }

  async create(dto: CreateNegotiationDto): Promise<Negotiation> {
    const disease = await this.diseaseService.findOne(dto.diseaseId);
    if (!disease) {
      throw new BadRequestException('关联的病害记录不存在');
    }

    const negotiation = this.negotiationRepository.create({
      ...dto,
      status: dto.status ?? NegotiationStatus.IN_PROGRESS,
    });

    const saved = await this.negotiationRepository.save(negotiation);

    await this.diseaseService.addTimeline({
      diseaseId: dto.diseaseId,
      operatorId: dto.initiatorId,
      action: '启动协商',
      content: dto.salesOpinion || '销售发起补苗协商',
      operatedAt: new Date().toISOString(),
    });

    return this.findOne(saved.id);
  }

  async updateStatus(id: number, dto: UpdateNegotiationStatusDto): Promise<Negotiation> {
    const negotiation = await this.findOne(id);
    if (!negotiation) {
      throw new BadRequestException('协商记录不存在');
    }

    const updateData: Partial<Negotiation> = {
      status: dto.status,
    };

    if (dto.salesOpinion !== undefined) updateData.salesOpinion = dto.salesOpinion;
    if (dto.baseOpinion !== undefined) updateData.baseOpinion = dto.baseOpinion;
    if (dto.replantQuantity !== undefined) updateData.replantQuantity = dto.replantQuantity;
    if (dto.replantVariety !== undefined) updateData.replantVariety = dto.replantVariety;
    if (dto.replantDate !== undefined) updateData.replantDate = dto.replantDate;

    if (dto.status === NegotiationStatus.CONFIRMED || dto.status === NegotiationStatus.CLOSED) {
      updateData.confirmedById = dto.operatorId;
      updateData.confirmedAt = new Date();
    }

    await this.negotiationRepository.update(id, updateData);

    const actionText = this.getStatusActionText(dto.status);
    const content = [
      dto.baseOpinion,
      dto.replantQuantity ? `补植${dto.replantQuantity}株` : '',
      dto.replantVariety ? `品种：${dto.replantVariety}` : '',
      dto.replantDate ? `日期：${dto.replantDate}` : '',
    ].filter(Boolean).join('，');

    await this.diseaseService.addTimeline({
      diseaseId: negotiation.diseaseId,
      operatorId: dto.operatorId,
      action: `协商${actionText}`,
      content,
      operatedAt: new Date().toISOString(),
    });

    return this.findOne(id);
  }

  private getStatusActionText(status: NegotiationStatus): string {
    const map = {
      [NegotiationStatus.PENDING]: '待处理',
      [NegotiationStatus.IN_PROGRESS]: '处理中',
      [NegotiationStatus.CONFIRMED]: '已确认',
      [NegotiationStatus.CLOSED]: '已关闭',
    };
    return map[status];
  }
}
