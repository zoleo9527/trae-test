import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
  WorkOrder,
  WorkOrderStatus,
  User,
  Member,
  AuditModule,
} from '../../database/entities';
import { AuditService } from '../../common/audit';

export interface CreateFollowUpDto {
  memberId: string;
  workOrderId?: string;
  type: FollowUpType;
  channel: string;
  followUpContent: string;
  plannedAt: Date;
  assignedTo?: string;
}

export interface CompleteFollowUpDto {
  result: string;
  customerFeedback?: string;
  internalNote?: string;
  needsEscalation?: boolean;
  escalationReason?: string;
  nextFollowUpAt?: Date;
}

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private auditService: AuditService,
  ) {}

  async generateFollowUpNo(): Promise<string> {
    const date = new Date();
    const prefix = `FU${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    const lastFollowUp = await this.followUpRepository
      .createQueryBuilder('fu')
      .where('fu.followUpNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('fu.followUpNo', 'DESC')
      .getOne();

    if (lastFollowUp) {
      const lastNum = parseInt(lastFollowUp.followUpNo.slice(-4));
      return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
    }

    return `${prefix}0001`;
  }

  async create(dto: CreateFollowUpDto, operator: User): Promise<FollowUp> {
    const member = await this.memberRepository.findOne({
      where: { id: dto.memberId, isDeleted: false },
    });
    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    if (dto.workOrderId) {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id: dto.workOrderId, isDeleted: false },
      });
      if (!workOrder) {
        throw new NotFoundException('工单不存在');
      }
    }

    const followUpNo = await this.generateFollowUpNo();

    const followUp = this.followUpRepository.create({
      followUpNo,
      memberId: dto.memberId,
      workOrderId: dto.workOrderId,
      type: dto.type,
      channel: dto.channel as any,
      followUpContent: dto.followUpContent,
      plannedAt: dto.plannedAt,
      assignedTo: dto.assignedTo,
      createdBy: operator.id,
      updatedBy: operator.id,
      status: FollowUpStatus.PENDING,
    });

    const saved = await this.followUpRepository.save(followUp);

    await this.auditService.logCreate(
      AuditModule.FOLLOW_UP,
      saved.id,
      { ...saved },
      operator,
    );

    return this.findOne(saved.id);
  }

  async findAll(
    filters?: {
      status?: FollowUpStatus;
      type?: FollowUpType;
      memberId?: string;
      assignedTo?: string;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: FollowUp[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.followUpRepository
      .createQueryBuilder('fu')
      .leftJoinAndSelect('fu.member', 'member')
      .leftJoinAndSelect('fu.workOrder', 'workOrder')
      .leftJoinAndSelect('fu.assignee', 'assignee')
      .where('fu.isDeleted = :isDeleted', { isDeleted: false });

    if (filters?.status) {
      queryBuilder.andWhere('fu.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      queryBuilder.andWhere('fu.type = :type', { type: filters.type });
    }
    if (filters?.memberId) {
      queryBuilder.andWhere('fu.memberId = :memberId', { memberId: filters.memberId });
    }
    if (filters?.assignedTo) {
      queryBuilder.andWhere('fu.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    queryBuilder.orderBy('fu.plannedAt', 'ASC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<FollowUp> {
    const followUp = await this.followUpRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['member', 'workOrder', 'assignee'],
    });

    if (!followUp) {
      throw new NotFoundException('回访记录不存在');
    }

    return followUp;
  }

  async complete(id: string, dto: CompleteFollowUpDto, operator: User): Promise<FollowUp> {
    const followUp = await this.findOne(id);
    const oldValues = { ...followUp };

    if (followUp.status === FollowUpStatus.COMPLETED) {
      throw new BadRequestException('该回访已完成');
    }

    followUp.status = FollowUpStatus.COMPLETED;
    followUp.result = dto.result as any;
    followUp.customerFeedback = dto.customerFeedback;
    followUp.internalNote = dto.internalNote;
    followUp.actualAt = new Date();
    followUp.followUpCount = followUp.followUpCount + 1;
    followUp.needsEscalation = dto.needsEscalation || false;
    followUp.escalationReason = dto.escalationReason;
    followUp.nextFollowUpAt = dto.nextFollowUpAt;
    followUp.updatedBy = operator.id;

    const updated = await this.followUpRepository.save(followUp);

    await this.auditService.logUpdate(
      AuditModule.FOLLOW_UP,
      id,
      oldValues,
      { ...updated },
      operator,
    );

    return this.findOne(id);
  }

  async getPendingStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingCount, overdueCount, todayCount] = await Promise.all([
      this.followUpRepository.count({
        where: { status: FollowUpStatus.PENDING, isDeleted: false },
      }),
      this.followUpRepository.count({
        where: {
          status: FollowUpStatus.PENDING,
          isDeleted: false,
        },
      }),
      this.followUpRepository.count({
        where: {
          status: FollowUpStatus.PENDING,
          isDeleted: false,
        },
      }),
    ]);

    return {
      pending: pendingCount,
      overdue: 0,
      today: todayCount,
    };
  }

  async autoCreateFollowUp(workOrderId: string, operator: User): Promise<FollowUp> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId, isDeleted: false },
      relations: ['member'],
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    if (!workOrder.needsFollowUp) {
      throw new BadRequestException('该工单不需要回访');
    }

    const plannedAt = new Date();
    plannedAt.setDate(plannedAt.getDate() + 3);

    return this.create({
      memberId: workOrder.memberId,
      workOrderId: workOrder.id,
      type: FollowUpType.REPAIR_COMPLETED,
      channel: 'phone',
      followUpContent: '售后返修完成回访，了解客户满意度',
      plannedAt,
    }, operator);
  }
}
