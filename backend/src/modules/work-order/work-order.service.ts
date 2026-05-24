import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderItem,
  StatusHistory,
  User,
  Member,
  AuditModule,
} from '../../database/entities';
import { WorkOrderStateMachine } from '../../common/state-machine';
import { AuditService } from '../../common/audit';

export interface CreateWorkOrderDto {
  type: string;
  priority: string;
  memberId: string;
  problemDescription: string;
  customerRequirement?: string;
  internalNote?: string;
  estimatedCost?: number;
  expectedCompletionAt?: Date;
  items: Array<{
    productId?: string;
    itemName: string;
    itemSpec?: string;
    quantity: number;
    itemValue?: number;
    conditionBefore?: string;
    imageUrlsBefore?: string;
  }>;
}

export interface UpdateWorkOrderDto {
  type?: string;
  priority?: string;
  problemDescription?: string;
  customerRequirement?: string;
  internalNote?: string;
  estimatedCost?: number;
  expectedCompletionAt?: Date;
  handlerId?: string;
}

export interface ChangeStatusDto {
  status: WorkOrderStatus;
  reason?: string;
}

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderItem)
    private workOrderItemRepository: Repository<WorkOrderItem>,
    @InjectRepository(StatusHistory)
    private statusHistoryRepository: Repository<StatusHistory>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private stateMachine: WorkOrderStateMachine,
    private auditService: AuditService,
    private dataSource: DataSource,
  ) {}

  async generateOrderNo(): Promise<string> {
    const date = new Date();
    const prefix = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    const lastOrder = await this.workOrderRepository
      .createQueryBuilder('wo')
      .where('wo.orderNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('wo.orderNo', 'DESC')
      .getOne();

    if (lastOrder) {
      const lastNum = parseInt(lastOrder.orderNo.slice(-4));
      return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
    }

    return `${prefix}0001`;
  }

  async create(dto: CreateWorkOrderDto, operator: User): Promise<WorkOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const member = await this.memberRepository.findOne({
        where: { id: dto.memberId, isDeleted: false },
      });
      if (!member) {
        throw new NotFoundException('会员不存在');
      }

      const orderNo = await this.generateOrderNo();

      const workOrder = this.workOrderRepository.create({
        orderNo,
        type: dto.type as any,
        priority: dto.priority as any,
        memberId: dto.memberId,
        problemDescription: dto.problemDescription,
        customerRequirement: dto.customerRequirement,
        internalNote: dto.internalNote,
        estimatedCost: dto.estimatedCost,
        expectedCompletionAt: dto.expectedCompletionAt,
        createdBy: operator.id,
        updatedBy: operator.id,
        status: WorkOrderStatus.DRAFT,
      });

      const savedOrder = await queryRunner.manager.save(workOrder);

      if (dto.items && dto.items.length > 0) {
        const items = dto.items.map((item) =>
          this.workOrderItemRepository.create({
            ...item,
            workOrderId: savedOrder.id,
            createdBy: operator.id,
            updatedBy: operator.id,
          }),
        );
        await queryRunner.manager.save(items);
      }

      await queryRunner.commitTransaction();

      await this.auditService.logCreate(
        AuditModule.WORK_ORDER,
        savedOrder.id,
        { ...savedOrder, items: dto.items },
        operator,
      );

      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    filters?: {
      status?: WorkOrderStatus;
      type?: string;
      memberId?: string;
      handlerId?: string;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: WorkOrder[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.member', 'member')
      .leftJoinAndSelect('wo.handler', 'handler')
      .leftJoinAndSelect('wo.items', 'items')
      .where('wo.isDeleted = :isDeleted', { isDeleted: false });

    if (filters?.status) {
      queryBuilder.andWhere('wo.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      queryBuilder.andWhere('wo.type = :type', { type: filters.type });
    }
    if (filters?.memberId) {
      queryBuilder.andWhere('wo.memberId = :memberId', { memberId: filters.memberId });
    }
    if (filters?.handlerId) {
      queryBuilder.andWhere('wo.handlerId = :handlerId', { handlerId: filters.handlerId });
    }

    queryBuilder.orderBy('wo.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['member', 'handler', 'items', 'repairs', 'followUps', 'statusHistories', 'statusHistories.operator'],
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    return workOrder;
  }

  async update(id: string, dto: UpdateWorkOrderDto, operator: User): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const oldValues = { ...workOrder };

    if (workOrder.status !== WorkOrderStatus.DRAFT && workOrder.status !== WorkOrderStatus.REJECTED) {
      throw new BadRequestException('当前状态不允许修改工单信息');
    }

    Object.assign(workOrder, dto);
    workOrder.updatedBy = operator.id;

    const updated = await this.workOrderRepository.save(workOrder);

    await this.auditService.logUpdate(
      AuditModule.WORK_ORDER,
      id,
      oldValues,
      { ...updated },
      operator,
    );

    return this.findOne(id);
  }

  async changeStatus(id: string, dto: ChangeStatusDto, operator: User): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const oldStatus = workOrder.status;

    this.stateMachine.validateTransition(oldStatus, dto.status, operator.role);

    workOrder.status = dto.status;
    workOrder.updatedBy = operator.id;

    if (dto.status === WorkOrderStatus.COMPLETED) {
      workOrder.completedAt = new Date();
    }

    const updated = await this.workOrderRepository.save(workOrder);

    const history = this.statusHistoryRepository.create({
      workOrderId: id,
      fromStatus: oldStatus,
      toStatus: dto.status,
      operatorId: operator.id,
      changeReason: dto.reason,
      snapshotData: { workOrder: { ...updated } },
      createdBy: operator.id,
    });
    await this.statusHistoryRepository.save(history);

    await this.auditService.logStatusChange(
      AuditModule.WORK_ORDER,
      id,
      oldStatus,
      dto.status,
      dto.reason,
      operator,
    );

    return this.findOne(id);
  }

  async getDashboardStats(): Promise<any> {
    const [pendingCount, inProgressCount, rejectedCount, needsReviewCount, completedCount] = await Promise.all([
      this.workOrderRepository.count({
        where: {
          status: WorkOrderStatus.PENDING_REVIEW,
          isDeleted: false,
        },
      }),
      this.workOrderRepository.count({
        where: {
          status: WorkOrderStatus.IN_PROGRESS,
          isDeleted: false,
        },
      }),
      this.workOrderRepository.count({
        where: {
          status: WorkOrderStatus.REJECTED,
          isDeleted: false,
        },
      }),
      this.workOrderRepository.count({
        where: {
          status: WorkOrderStatus.NEEDS_REVIEW,
          isDeleted: false,
        },
      }),
      this.workOrderRepository.count({
        where: {
          status: WorkOrderStatus.COMPLETED,
          isDeleted: false,
        },
      }),
    ]);

    return {
      pendingReview: pendingCount,
      inProgress: inProgressCount,
      rejected: rejectedCount,
      needsReview: needsReviewCount,
      completed: completedCount,
    };
  }

  async getStatusHistories(workOrderId: string): Promise<StatusHistory[]> {
    return this.statusHistoryRepository.find({
      where: { workOrderId },
      order: { createdAt: 'DESC' },
      relations: ['operator'],
    });
  }
}
