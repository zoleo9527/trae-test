import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from './refund.entity';
import { RefundStatus } from '../../common/enums/refund-status.enum';
import { RefundStateMachine } from '../../common/state-machines/refund.state-machine';
import { WorkOrderService } from '../work-order/work-order.service';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { BusinessError, ErrorCode } from '../../common/errors/business-error';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    private readonly workOrderService: WorkOrderService,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<Refund>, operatorId: string, operatorName: string): Promise<Refund> {
    const refund = this.refundRepository.create({
      ...data,
      status: RefundStatus.DRAFT,
      initiatorId: operatorId,
      createdBy: operatorId,
      updatedBy: operatorId,
    });

    const saved = await this.refundRepository.save(refund);

    await this.workOrderService.updateStatus(
      data.workOrderId,
      WorkOrderStatus.REFUND_NEGOTIATING,
      operatorId,
      operatorName,
      '发起退款申请',
    );

    await this.auditService.log(
      'Refund',
      saved.id,
      'CREATE',
      null,
      saved,
      operatorId,
      operatorName,
      '创建退款申请',
    );

    return this.findOne(saved.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: RefundStatus;
      workOrderId?: string;
      initiatorId?: string;
    },
  ): Promise<{ data: Refund[]; total: number }> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.workOrderId) where.workOrderId = filters.workOrderId;
    if (filters?.initiatorId) where.initiatorId = filters.initiatorId;

    const [data, total] = await this.refundRepository.findAndCount({
      where,
      relations: ['workOrder', 'initiator', 'reviewer', 'comments', 'comments.author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: [
        'workOrder',
        'workOrder.student',
        'initiator',
        'reviewer',
        'comments',
        'comments.author',
      ],
    });

    if (!refund) {
      throw BusinessError(ErrorCode.REFUND_NOT_FOUND, `退款申请 ${id} 不存在`);
    }

    return refund;
  }

  async updateStatus(
    id: string,
    newStatus: RefundStatus,
    operatorId: string,
    operatorName: string,
    data?: {
      rejectionReason?: string;
      approvedAmount?: number;
      reviewerId?: string;
    },
  ): Promise<Refund> {
    const refund = await this.findOne(id);
    const oldStatus = refund.status;

    RefundStateMachine.transition(oldStatus, newStatus);

    const oldValue = { ...refund };

    refund.status = newStatus;
    refund.updatedBy = operatorId;

    if (data?.rejectionReason) {
      refund.rejectionReason = data.rejectionReason;
    }
    if (data?.approvedAmount !== undefined) {
      refund.approvedAmount = data.approvedAmount;
    }
    if (data?.reviewerId) {
      refund.reviewerId = data.reviewerId;
      refund.reviewedAt = new Date();
    }

    if (newStatus === RefundStatus.COMPLETED) {
      refund.completedAt = new Date();
      await this.workOrderService.updateStatus(
        refund.workOrderId,
        WorkOrderStatus.REFUNDED,
        operatorId,
        operatorName,
        '退款完成',
      );
    }

    const saved = await this.refundRepository.save(refund);

    await this.auditService.log(
      'Refund',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status: newStatus },
      operatorId,
      operatorName,
      `退款状态从 ${oldStatus} 变更为 ${newStatus}`,
    );

    return this.findOne(id);
  }

  async addNegotiationHistory(
    id: string,
    history: string,
    operatorId: string,
    operatorName: string,
  ): Promise<Refund> {
    const refund = await this.findOne(id);
    const oldValue = { ...refund };

    const timestamp = new Date().toISOString();
    const newEntry = `[${timestamp}] ${operatorName}: ${history}`;

    refund.negotiationHistory = refund.negotiationHistory
      ? `${refund.negotiationHistory}\n${newEntry}`
      : newEntry;
    refund.updatedBy = operatorId;

    const saved = await this.refundRepository.save(refund);

    await this.auditService.log(
      'Refund',
      id,
      'ADD_NEGOTIATION',
      oldValue,
      saved,
      operatorId,
      operatorName,
      '添加协商记录',
    );

    return saved;
  }

  async update(
    id: string,
    data: Partial<Refund>,
    operatorId: string,
    operatorName: string,
  ): Promise<Refund> {
    const refund = await this.findOne(id);
    const oldValue = { ...refund };

    Object.assign(refund, data, { updatedBy: operatorId });
    const saved = await this.refundRepository.save(refund);

    await this.auditService.log(
      'Refund',
      id,
      'UPDATE',
      oldValue,
      saved,
      operatorId,
      operatorName,
      '更新退款申请',
    );

    return this.findOne(id);
  }
}
