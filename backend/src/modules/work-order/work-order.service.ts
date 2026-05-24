import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { WorkOrderStateMachine } from '../../common/state-machines/work-order.state-machine';
import { createError, ErrorCode } from '../../common/errors/business-error';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit-log.entity';
import { Refund } from '../refund/refund.entity';
import { Transfer } from '../transfer/transfer.entity';
import { Material } from '../material/material.entity';
import { Comment } from '../comment/comment.entity';
import { Deadline } from '../deadline/deadline.entity';

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Deadline)
    private readonly deadlineRepository: Repository<Deadline>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<WorkOrder>, operatorId: string, operatorName: string): Promise<WorkOrder> {
    const orderNo = await this.generateOrderNo();
    const workOrder = this.workOrderRepository.create({
      ...data,
      orderNo,
      createdBy: operatorId,
      updatedBy: operatorId,
    });
    const saved = await this.workOrderRepository.save(workOrder);

    await this.auditService.log(
      'WorkOrder',
      saved.id,
      'CREATE',
      null,
      saved,
      operatorId,
      operatorName,
      '创建工单',
    );

    return saved;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: WorkOrderStatus;
      studentId?: string;
      currentConsultantId?: string;
    },
  ): Promise<{ data: WorkOrder[]; total: number }> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.currentConsultantId) where.currentConsultantId = filters.currentConsultantId;

    const [data, total] = await this.workOrderRepository.findAndCount({
      where,
      relations: ['student', 'currentConsultant', 'previousConsultant'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: [
        'student',
        'currentConsultant',
        'previousConsultant',
        'refunds',
        'refunds.initiator',
        'refunds.reviewer',
        'refunds.comments',
        'refunds.comments.author',
        'transfers',
        'transfers.fromConsultant',
        'transfers.toConsultant',
        'transfers.comments',
        'transfers.comments.author',
        'materials',
        'materials.owner',
        'materials.versions',
        'materials.versions.uploader',
        'materials.comments',
        'materials.comments.author',
        'comments',
        'comments.author',
        'deadlines',
        'deadlines.assignee',
      ],
    });

    if (!workOrder) {
      throw createError(ErrorCode.WORK_ORDER_NOT_FOUND, `工单 ${id} 不存在`);
    }

    const auditTimeline = await this.getAuditTimeline(id);
    (workOrder as any).auditTimeline = auditTimeline;

    return workOrder;
  }

  private async getAuditTimeline(workOrderId: string): Promise<AuditLog[]> {
    const allLogs: AuditLog[] = [];

    const workOrderLogs = await this.auditLogRepository.find({
      where: { entityType: 'WorkOrder', entityId: workOrderId },
      order: { createdAt: 'DESC' },
    });
    allLogs.push(...workOrderLogs);

    const [refunds, transfers, materials, comments, deadlines] = await Promise.all([
      this.refundRepository.find({ where: { workOrderId }, select: ['id'] }),
      this.transferRepository.find({ where: { workOrderId }, select: ['id'] }),
      this.materialRepository.find({ where: { workOrderId }, select: ['id'] }),
      this.commentRepository.find({ where: { workOrderId }, select: ['id'] }),
      this.deadlineRepository.find({ where: { workOrderId }, select: ['id'] }),
    ]);

    const refundIds = refunds.map(r => r.id);
    const transferIds = transfers.map(t => t.id);
    const materialIds = materials.map(m => m.id);
    const commentIds = comments.map(c => c.id);
    const deadlineIds = deadlines.map(d => d.id);

    const [refundLogs, transferLogs, materialLogs, commentLogs, deadlineLogs] = await Promise.all([
      refundIds.length > 0
        ? this.auditLogRepository.find({ where: { entityType: 'Refund', entityId: In(refundIds) } })
        : [],
      transferIds.length > 0
        ? this.auditLogRepository.find({ where: { entityType: 'Transfer', entityId: In(transferIds) } })
        : [],
      materialIds.length > 0
        ? this.auditLogRepository.find({ where: { entityType: 'Material', entityId: In(materialIds) } })
        : [],
      commentIds.length > 0
        ? this.auditLogRepository.find({ where: { entityType: 'Comment', entityId: In(commentIds) } })
        : [],
      deadlineIds.length > 0
        ? this.auditLogRepository.find({ where: { entityType: 'Deadline', entityId: In(deadlineIds) } })
        : [],
    ]);

    allLogs.push(...refundLogs, ...transferLogs, ...materialLogs, ...commentLogs, ...deadlineLogs);

    return allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateStatus(
    id: string,
    newStatus: WorkOrderStatus,
    operatorId: string,
    operatorName: string,
    remark?: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const oldStatus = workOrder.status;

    WorkOrderStateMachine.transition(oldStatus, newStatus);

    const oldValue = { ...workOrder };
    workOrder.status = newStatus;
    workOrder.updatedBy = operatorId;
    const saved = await this.workOrderRepository.save(workOrder);

    await this.auditService.log(
      'WorkOrder',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status: newStatus },
      operatorId,
      operatorName,
      remark || `状态从 ${oldStatus} 变更为 ${newStatus}`,
    );

    return saved;
  }

  async update(
    id: string,
    data: Partial<WorkOrder>,
    operatorId: string,
    operatorName: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const oldValue = { ...workOrder };

    Object.assign(workOrder, data, { updatedBy: operatorId });
    const saved = await this.workOrderRepository.save(workOrder);

    await this.auditService.log(
      'WorkOrder',
      id,
      'UPDATE',
      oldValue,
      saved,
      operatorId,
      operatorName,
      '更新工单信息',
    );

    return saved;
  }

  async getOverview(consultantId?: string): Promise<any> {
    const where: any = {};
    if (consultantId) where.currentConsultantId = consultantId;

    const statusCounts = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .select('workOrder.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('workOrder.status')
      .getRawMany();

    const total = await this.workOrderRepository.count({ where });

    return {
      total,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const prefix = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    const lastOrder = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .where('workOrder.orderNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('workOrder.orderNo', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.slice(-4));
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
