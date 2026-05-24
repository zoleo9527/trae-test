import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { WorkOrderStateMachine } from '../../common/state-machines/work-order.state-machine';
import { BusinessError, ErrorCode } from '../../common/errors/business-error';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
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
        'transfers',
        'materials',
        'comments',
        'comments.author',
        'deadlines',
      ],
    });

    if (!workOrder) {
      throw BusinessError(ErrorCode.WORK_ORDER_NOT_FOUND, `工单 ${id} 不存在`);
    }

    return workOrder;
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

    const lastOrder = await this.workOrderRepository.findOne({
      where: { orderNo: () => `orderNo LIKE '${prefix}%'` },
      order: { orderNo: 'DESC' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.slice(-4));
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
