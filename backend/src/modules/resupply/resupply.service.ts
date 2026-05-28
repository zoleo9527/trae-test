import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResupplyRequest, EvidenceChain, Material } from '../../entities';

@Injectable()
export class ResupplyService {
  constructor(
    @InjectRepository(ResupplyRequest)
    private requestRepository: Repository<ResupplyRequest>,
    @InjectRepository(EvidenceChain)
    private evidenceRepository: Repository<EvidenceChain>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async findAll(status?: string): Promise<ResupplyRequest[]> {
    const where = status ? { status } : {};
    return this.requestRepository.find({
      where,
      relations: ['camper', 'material', 'evidenceChain'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ResupplyRequest> {
    return this.requestRepository.findOne({
      where: { id },
      relations: ['camper', 'material', 'evidenceChain'],
    });
  }

  async create(data: Partial<ResupplyRequest>): Promise<ResupplyRequest> {
    const request = this.requestRepository.create({
      ...data,
      status: 'pending',
      currentHandler: 'director',
    });
    const saved = await this.requestRepository.save(request);

    await this.addEvidence(saved.id, 'create', '班务老师发起补领申请', data.requestedBy, 'teacher');

    return this.findOne(saved.id);
  }

  async review(id: string, data: { action: string; operator: string; reason?: string }): Promise<ResupplyRequest> {
    const request = await this.findOne(id);
    
    if (data.action === 'approve') {
      await this.requestRepository.update(id, {
        status: 'approved',
        reviewedBy: data.operator,
        currentHandler: 'logistics',
      });
      await this.addEvidence(id, 'review_approve', '营地主任审核通过', data.operator, 'director');
    } else {
      await this.requestRepository.update(id, {
        status: 'rejected',
        reviewedBy: data.operator,
        rejectReason: data.reason,
        currentHandler: null,
      });
      await this.addEvidence(id, 'review_reject', `营地主任驳回申请: ${data.reason}`, data.operator, 'director');
    }

    return this.findOne(id);
  }

  async fulfill(id: string, data: { operator: string; note?: string }): Promise<ResupplyRequest> {
    const request = await this.findOne(id);
    const material = await this.materialRepository.findOne({ where: { id: request.materialId } });

    if (!material) {
      throw new HttpException('物资不存在', HttpStatus.NOT_FOUND);
    }

    if (material.stockQuantity < request.quantity) {
      throw new HttpException(
        `${material.name} 库存不足，当前库存 ${material.stockQuantity} ${material.unit}，补领数量 ${request.quantity} ${material.unit}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    
    await this.requestRepository.update(id, {
      status: 'fulfilled',
      fulfilledBy: data.operator,
      fulfillNote: data.note,
      currentHandler: 'teacher',
    });

    await this.materialRepository.decrement(
      { id: request.materialId },
      'stockQuantity',
      request.quantity,
    );

    await this.addEvidence(id, 'fulfill', '后勤完成物资发放', data.operator, 'logistics');

    return this.findOne(id);
  }

  async close(id: string, data: { operator: string; note?: string; parentNotified?: boolean }): Promise<ResupplyRequest> {
    await this.requestRepository.update(id, {
      status: 'closed',
      followupNote: data.note,
      parentNotified: data.parentNotified || false,
      parentNotifiedAt: data.parentNotified ? new Date() : null,
      currentHandler: null,
    });

    await this.addEvidence(id, 'close', '班务老师确认完成并回访家长', data.operator, 'teacher');

    return this.findOne(id);
  }

  async addEvidence(requestId: string, actionType: string, content: string, operator: string, operatorRole: string): Promise<EvidenceChain> {
    const evidence = this.evidenceRepository.create({
      requestId,
      actionType,
      content,
      operator,
      operatorRole,
    });
    return this.evidenceRepository.save(evidence);
  }

  async getEvidenceChain(requestId: string): Promise<EvidenceChain[]> {
    return this.evidenceRepository.find({
      where: { requestId },
      order: { createdAt: 'ASC' },
    });
  }

  async getStats(): Promise<any> {
    const pending = await this.requestRepository.count({ where: { status: 'pending' } });
    const approved = await this.requestRepository.count({ where: { status: 'approved' } });
    const fulfilled = await this.requestRepository.count({ where: { status: 'fulfilled' } });
    const closed = await this.requestRepository.count({ where: { status: 'closed' } });
    const rejected = await this.requestRepository.count({ where: { status: 'rejected' } });
    const total = pending + approved + fulfilled + closed + rejected;

    return { total, pending, approved, fulfilled, closed, rejected };
  }

  async getMyTasks(role: string): Promise<ResupplyRequest[]> {
    let statusMap = {
      director: 'pending',
      logistics: 'approved',
      teacher: 'fulfilled',
    };

    const status = statusMap[role];
    if (!status) return [];

    return this.requestRepository.find({
      where: { status },
      relations: ['camper', 'material'],
      order: { createdAt: 'ASC' },
    });
  }
}
