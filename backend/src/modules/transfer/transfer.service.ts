import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from './transfer.entity';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { TransferStateMachine } from '../../common/state-machines/transfer.state-machine';
import { WorkOrderService } from '../work-order/work-order.service';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { BusinessError, ErrorCode } from '../../common/errors/business-error';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    private readonly workOrderService: WorkOrderService,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<Transfer>, operatorId: string, operatorName: string): Promise<Transfer> {
    const transfer = this.transferRepository.create({
      ...data,
      fromConsultantId: data.fromConsultantId,
      status: TransferStatus.INITIATED,
      initiatorId: operatorId,
      createdBy: operatorId,
      updatedBy: operatorId,
    });

    const saved = await this.transferRepository.save(transfer);

    await this.workOrderService.updateStatus(
      data.workOrderId,
      WorkOrderStatus.TRANSFERRING,
      operatorId,
      operatorName,
      '发起顾问交接',
    );

    await this.auditService.log(
      'Transfer',
      saved.id,
      'CREATE',
      null,
      saved,
      operatorId,
      operatorName,
      '创建顾问交接',
    );

    return this.findOne(saved.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: TransferStatus;
      workOrderId?: string;
      fromConsultantId?: string;
      toConsultantId?: string;
    },
  ): Promise<{ data: Transfer[]; total: number }> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.workOrderId) where.workOrderId = filters.workOrderId;
    if (filters?.fromConsultantId) where.fromConsultantId = filters.fromConsultantId;
    if (filters?.toConsultantId) where.toConsultantId = filters.toConsultantId;

    const [data, total] = await this.transferRepository.findAndCount({
      where,
      relations: [
        'workOrder',
        'workOrder.student',
        'fromConsultant',
        'toConsultant',
        'comments',
        'comments.author',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: [
        'workOrder',
        'workOrder.student',
        'fromConsultant',
        'toConsultant',
        'comments',
        'comments.author',
      ],
    });

    if (!transfer) {
      throw BusinessError(ErrorCode.TRANSFER_NOT_FOUND, `交接记录 ${id} 不存在`);
    }

    return transfer;
  }

  async updateStatus(
    id: string,
    newStatus: TransferStatus,
    operatorId: string,
    operatorName: string,
    data?: {
      rejectionReason?: string;
    },
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);
    const oldStatus = transfer.status;

    TransferStateMachine.transition(oldStatus, newStatus);

    const oldValue = { ...transfer };

    transfer.status = newStatus;
    transfer.updatedBy = operatorId;

    if (data?.rejectionReason) {
      transfer.rejectionReason = data.rejectionReason;
    }

    if (newStatus === TransferStatus.RECEIVED) {
      transfer.receivedAt = new Date();
    }

    if (newStatus === TransferStatus.COMPLETED) {
      transfer.completedAt = new Date();

      await this.workOrderService.update(
        transfer.workOrderId,
        {
          currentConsultantId: transfer.toConsultantId,
          previousConsultantId: transfer.fromConsultantId,
        },
        operatorId,
        operatorName,
      );

      await this.workOrderService.updateStatus(
        transfer.workOrderId,
        WorkOrderStatus.IN_PROGRESS,
        operatorId,
        operatorName,
        '顾问交接完成',
      );
    }

    if (newStatus === TransferStatus.REJECTED) {
      await this.workOrderService.updateStatus(
        transfer.workOrderId,
        WorkOrderStatus.IN_PROGRESS,
        operatorId,
        operatorName,
        '顾问交接被驳回',
      );
    }

    const saved = await this.transferRepository.save(transfer);

    await this.auditService.log(
      'Transfer',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status: newStatus },
      operatorId,
      operatorName,
      `交接状态从 ${oldStatus} 变更为 ${newStatus}`,
    );

    return this.findOne(id);
  }

  async updateHandoverContent(
    id: string,
    data: { handoverContent?: string; keyNotes?: string; pendingItems?: string },
    operatorId: string,
    operatorName: string,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);
    const oldValue = { ...transfer };

    Object.assign(transfer, data, { updatedBy: operatorId });
    const saved = await this.transferRepository.save(transfer);

    await this.auditService.log(
      'Transfer',
      id,
      'UPDATE_HANDOVER',
      oldValue,
      saved,
      operatorId,
      operatorName,
      '更新交接内容',
    );

    return this.findOne(id);
  }
}
