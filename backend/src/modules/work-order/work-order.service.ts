import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like, In } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { StatusHistory } from '../../entities/status-history.entity';
import { User } from '../../entities/user.entity';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage, PartRequestStatus } from '../../entities/part-usage.entity';
import { ReviewRecord, ReviewLevel } from '../../entities/review-record.entity';
import { WorkOrderStatus, WorkOrderStatusFlow } from '../../common/enums/work-order.enum';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';
import { CreateWorkOrderDto, UpdateWorkOrderDto, QueryWorkOrderDto, TransitionStatusDto, AssignHandlerDto } from './dto/work-order.dto';
import {
  ConfirmDowntimeDto,
  RequestPartDto,
  ApprovePartDto,
  ReceivePartDto,
  CompleteRepairDto,
  SubmitReviewDto,
  VerifyReviewDto,
} from './dto/workflow.dto';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';
import * as csvWriter from 'csv-writer';
import * as path from 'path';

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(StatusHistory)
    private statusHistoryRepository: Repository<StatusHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DowntimeRecord)
    private downtimeRepository: Repository<DowntimeRecord>,
    @InjectRepository(SparePart)
    private sparePartRepository: Repository<SparePart>,
    @InjectRepository(PartUsage)
    private partUsageRepository: Repository<PartUsage>,
    @InjectRepository(ReviewRecord)
    private reviewRepository: Repository<ReviewRecord>,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateWorkOrderDto): Promise<WorkOrder> {
    const orderNo = await this.generateOrderNo();
    
    const workOrder = this.workOrderRepository.create({
      ...createDto,
      orderNo,
      status: WorkOrderStatus.ABNORMAL_REPORTED,
    });

    const saved = await this.workOrderRepository.save(workOrder);
    await this.createStatusHistory(saved.id, null, WorkOrderStatus.ABNORMAL_REPORTED, '工单创建', createDto.reporterId);
    
    return this.findOne(saved.id);
  }

  async findAll(queryDto: QueryWorkOrderDto): Promise<PaginatedResult<WorkOrder>> {
    const { page, limit, sortBy = 'createdAt', sortOrder, status, abnormalType, station, keyword, reporterId, handlerId, startDate, endDate } = queryDto;
    
    const queryBuilder = this.workOrderRepository.createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.reporter', 'reporter')
      .leftJoinAndSelect('workOrder.handler', 'handler')
      .leftJoinAndSelect('workOrder.downtimeRecords', 'downtimeRecords')
      .leftJoinAndSelect('workOrder.partUsages', 'partUsages')
      .leftJoinAndSelect('partUsages.sparePart', 'sparePart');

    if (status) {
      queryBuilder.andWhere('workOrder.status = :status', { status });
    }

    if (abnormalType) {
      queryBuilder.andWhere('workOrder.abnormalType = :abnormalType', { abnormalType });
    }

    if (station) {
      queryBuilder.andWhere('workOrder.station = :station', { station });
    }

    if (keyword) {
      queryBuilder.andWhere('(workOrder.title LIKE :keyword OR workOrder.orderNo LIKE :keyword OR workOrder.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (reporterId) {
      queryBuilder.andWhere('workOrder.reporterId = :reporterId', { reporterId });
    }

    if (handlerId) {
      queryBuilder.andWhere('workOrder.handlerId = :handlerId', { handlerId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('workOrder.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    queryBuilder.orderBy(`workOrder.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: [
        'reporter', 
        'handler', 
        'downtimeRecords', 
        'partUsages', 
        'partUsages.sparePart',
        'partUsages.requestedBy',
        'partUsages.approvedBy',
        'partUsages.receivedBy',
        'reviewRecords',
        'reviewRecords.submittedBy',
        'reviewRecords.verifiedBy',
        'statusHistories',
        'statusHistories.operatedBy',
      ],
    });

    if (!workOrder) {
      throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
    }

    return workOrder;
  }

  async update(id: string, updateDto: UpdateWorkOrderDto): Promise<WorkOrder> {
    await this.findOne(id);
    await this.workOrderRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async assignHandler(id: string, assignDto: AssignHandlerDto): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const handler = await this.userRepository.findOne({ where: { id: assignDto.handlerId } });
    
    if (!handler) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, '处理人不存在');
    }

    workOrder.handler = handler;
    workOrder.handlerId = handler.id;
    await this.workOrderRepository.save(workOrder);
    
    return this.findOne(id);
  }

  async transitionStatus(id: string, transitionDto: TransitionStatusDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id } });
      
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      const currentStatus = workOrder.status;
      const targetStatus = transitionDto.targetStatus;

      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new BusinessException(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `无法从 ${currentStatus} 转换到 ${targetStatus}`,
        );
      }

      workOrder.status = targetStatus;

      if (targetStatus === WorkOrderStatus.CLOSED) {
        workOrder.closedAt = new Date();
      }

      await manager.save(workOrder);

      const statusHistory = manager.create(StatusHistory, {
        workOrderId: id,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        remark: transitionDto.remark,
        operatedById: transitionDto.operatorId,
      });
      await manager.save(statusHistory);

      return this.findOne(id);
    });
  }

  async delete(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.remove(workOrder);
  }

  async exportToCsv(queryDto: QueryWorkOrderDto): Promise<string> {
    const result = await this.findAll({ ...queryDto, page: 1, limit: 10000 });
    
    const exportPath = path.join(process.cwd(), 'exports');
    const fileName = `work_orders_${Date.now()}.csv`;
    const filePath = path.join(exportPath, fileName);

    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'orderNo', title: '工单号' },
        { id: 'title', title: '标题' },
        { id: 'status', title: '状态' },
        { id: 'abnormalType', title: '异常类型' },
        { id: 'station', title: '电站' },
        { id: 'reporterName', title: '上报人' },
        { id: 'handlerName', title: '处理人' },
        { id: 'totalDowntimeMinutes', title: '停机时长(分钟)' },
        { id: 'powerLoss', title: '发电量损失(kWh)' },
        { id: 'createdAt', title: '创建时间' },
        { id: 'closedAt', title: '关闭时间' },
      ],
    });

    const records = result.data.map(order => ({
      orderNo: order.orderNo,
      title: order.title,
      status: order.status,
      abnormalType: order.abnormalType,
      station: order.station,
      reporterName: order.reporter?.name || '',
      handlerName: order.handler?.name || '',
      totalDowntimeMinutes: order.totalDowntimeMinutes || 0,
      powerLoss: order.powerLoss || 0,
      createdAt: order.createdAt.toISOString(),
      closedAt: order.closedAt?.toISOString() || '',
    }));

    await writer.writeRecords(records);
    return filePath;
  }

  async getStatistics(): Promise<any> {
    const statusCounts = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .select('workOrder.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('workOrder.status')
      .getRawMany();

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalDowntime = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .select('SUM(workOrder.totalDowntimeMinutes)', 'total')
      .where('workOrder.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    const totalPowerLoss = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .select('SUM(workOrder.powerLoss)', 'total')
      .where('workOrder.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    return {
      statusCounts,
      totalDowntimeMinutes: parseInt(totalDowntime.total || '0'),
      totalPowerLoss: parseFloat(totalPowerLoss.total || '0'),
    };
  }

  private canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
    const allowedTransitions = WorkOrderStatusFlow[from] || [];
    return allowedTransitions.includes(to);
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    const latest = await this.workOrderRepository.findOne({
      where: { orderNo: Like(`WO${dateStr}%`) },
      order: { orderNo: 'DESC' },
    });

    let sequence = 1;
    if (latest) {
      const match = latest.orderNo.match(/WO\d{8}(\d{4})/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `WO${dateStr}${String(sequence).padStart(4, '0')}`;
  }

  async confirmDowntime(workOrderId: string, dto: ConfirmDowntimeDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      if (workOrder.status !== WorkOrderStatus.ABNORMAL_REPORTED) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许确认停机');
      }

      const durationMinutes = dto.endTime
        ? Math.floor((dto.endTime.getTime() - dto.startTime.getTime()) / (1000 * 60))
        : 0;

      const downtime = manager.create(DowntimeRecord, {
        workOrderId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        durationMinutes,
        isConfirmed: true,
        confirmedById: dto.operatorId,
        confirmedAt: new Date(),
      });
      await manager.save(downtime);

      workOrder.status = WorkOrderStatus.DOWNTIME_CONFIRMED;
      workOrder.totalDowntimeMinutes = durationMinutes;
      await manager.save(workOrder);

      const history = manager.create(StatusHistory, {
        workOrderId,
        fromStatus: WorkOrderStatus.ABNORMAL_REPORTED,
        toStatus: WorkOrderStatus.DOWNTIME_CONFIRMED,
        remark: dto.remark || '确认停机',
        operatedById: dto.operatorId,
      });
      await manager.save(history);

      return this.findOne(workOrderId);
    });
  }

  async requestPart(workOrderId: string, dto: RequestPartDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      if (workOrder.status !== WorkOrderStatus.DOWNTIME_CONFIRMED) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许申请备件');
      }

      const sparePart = await manager.findOne(SparePart, { where: { id: dto.sparePartId } });
      if (!sparePart) {
        throw new BusinessException(ErrorCode.PART_NOT_FOUND, '备件不存在');
      }

      const partUsage = manager.create(PartUsage, {
        workOrderId,
        sparePartId: dto.sparePartId,
        quantity: dto.quantity,
        requestReason: dto.requestReason,
        requestedById: dto.operatorId,
        unitPrice: sparePart.unitPrice,
        totalPrice: sparePart.unitPrice * dto.quantity,
        status: PartRequestStatus.PENDING,
      });
      await manager.save(partUsage);

      workOrder.status = WorkOrderStatus.PART_REQUESTED;
      await manager.save(workOrder);

      const history = manager.create(StatusHistory, {
        workOrderId,
        fromStatus: WorkOrderStatus.DOWNTIME_CONFIRMED,
        toStatus: WorkOrderStatus.PART_REQUESTED,
        remark: `申请备件: ${sparePart.name} x ${dto.quantity}`,
        operatedById: dto.operatorId,
      });
      await manager.save(history);

      return this.findOne(workOrderId);
    });
  }

  async approvePart(workOrderId: string, dto: ApprovePartDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      if (workOrder.status !== WorkOrderStatus.PART_REQUESTED) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许审批备件');
      }

      const partUsage = await manager.findOne(PartUsage, { where: { id: dto.partUsageId, workOrderId } });
      if (!partUsage) {
        throw new BusinessException(ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
      }

      if (partUsage.status !== PartRequestStatus.PENDING) {
        throw new BusinessException(ErrorCode.INVALID_PART_USAGE_STATUS, '备件领用状态无效');
      }

      const sparePart = await manager.findOne(SparePart, { where: { id: partUsage.sparePartId } });

      if (dto.status === PartRequestStatus.APPROVED) {
        if (sparePart.stockQuantity < partUsage.quantity) {
          throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, '库存不足');
        }
        sparePart.stockQuantity -= partUsage.quantity;
        await manager.save(sparePart);
      }

      partUsage.status = dto.status;
      partUsage.approvedById = dto.operatorId;
      partUsage.approvedAt = new Date();
      partUsage.approvalRemark = dto.approvalRemark;
      await manager.save(partUsage);

      if (dto.status === PartRequestStatus.APPROVED) {
        workOrder.status = WorkOrderStatus.PART_APPROVED;
        await manager.save(workOrder);

        const history = manager.create(StatusHistory, {
          workOrderId,
          fromStatus: WorkOrderStatus.PART_REQUESTED,
          toStatus: WorkOrderStatus.PART_APPROVED,
          remark: dto.approvalRemark || '备件审批通过',
          operatedById: dto.operatorId,
        });
        await manager.save(history);
      } else if (dto.status === PartRequestStatus.REJECTED) {
        workOrder.status = WorkOrderStatus.DOWNTIME_CONFIRMED;
        await manager.save(workOrder);

        const history = manager.create(StatusHistory, {
          workOrderId,
          fromStatus: WorkOrderStatus.PART_REQUESTED,
          toStatus: WorkOrderStatus.DOWNTIME_CONFIRMED,
          remark: dto.approvalRemark || '备件审批驳回，可重新申请',
          operatedById: dto.operatorId,
        });
        await manager.save(history);
      }

      return this.findOne(workOrderId);
    });
  }

  async receivePart(workOrderId: string, dto: ReceivePartDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      if (workOrder.status !== WorkOrderStatus.PART_APPROVED) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许签收备件');
      }

      const partUsage = await manager.findOne(PartUsage, { where: { id: dto.partUsageId, workOrderId } });
      if (!partUsage) {
        throw new BusinessException(ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
      }

      if (partUsage.status !== PartRequestStatus.APPROVED) {
        throw new BusinessException(ErrorCode.INVALID_PART_USAGE_STATUS, '备件领用状态无效');
      }

      partUsage.status = PartRequestStatus.RECEIVED;
      partUsage.receivedById = dto.operatorId;
      partUsage.receivedAt = new Date();
      await manager.save(partUsage);

      workOrder.status = WorkOrderStatus.PART_RECEIVED;
      await manager.save(workOrder);

      const history = manager.create(StatusHistory, {
        workOrderId,
        fromStatus: WorkOrderStatus.PART_APPROVED,
        toStatus: WorkOrderStatus.PART_RECEIVED,
        remark: '备件已签收',
        operatedById: dto.operatorId,
      });
      await manager.save(history);

      return this.findOne(workOrderId);
    });
  }

  async completeRepair(workOrderId: string, dto: CompleteRepairDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      const fromStatus = workOrder.status;
      if (![WorkOrderStatus.DOWNTIME_CONFIRMED, WorkOrderStatus.PART_RECEIVED].includes(fromStatus)) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许完成维修');
      }

      workOrder.status = WorkOrderStatus.REPAIR_COMPLETED;
      await manager.save(workOrder);

      const history = manager.create(StatusHistory, {
        workOrderId,
        fromStatus,
        toStatus: WorkOrderStatus.REPAIR_COMPLETED,
        remark: dto.remark || '维修完成',
        operatedById: dto.operatorId,
      });
      await manager.save(history);

      return this.findOne(workOrderId);
    });
  }

  async submitReview(workOrderId: string, dto: SubmitReviewDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      if (workOrder.status !== WorkOrderStatus.REPAIR_COMPLETED) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许提交复盘');
      }

      const totalCost = (dto.actualPartCost || 0) + (dto.actualLaborCost || 0);

      const review = manager.create(ReviewRecord, {
        workOrderId,
        level: dto.level || ReviewLevel.MINOR,
        rootCause: dto.rootCause,
        repairProcess: dto.repairProcess,
        improvementMeasures: dto.improvementMeasures,
        lessonsLearned: dto.lessonsLearned,
        actualDowntimeMinutes: dto.actualDowntimeMinutes,
        actualPowerLoss: dto.actualPowerLoss,
        actualPartCost: dto.actualPartCost,
        actualLaborCost: dto.actualLaborCost,
        totalCost,
        submittedById: dto.operatorId,
        submittedAt: new Date(),
      });
      await manager.save(review);

      workOrder.status = WorkOrderStatus.REVIEW_SUBMITTED;
      await manager.save(workOrder);

      const history = manager.create(StatusHistory, {
        workOrderId,
        fromStatus: WorkOrderStatus.REPAIR_COMPLETED,
        toStatus: WorkOrderStatus.REVIEW_SUBMITTED,
        remark: '复盘已提交，等待验证',
        operatedById: dto.operatorId,
      });
      await manager.save(history);

      return this.findOne(workOrderId);
    });
  }

  async verifyReview(workOrderId: string, dto: VerifyReviewDto): Promise<WorkOrder> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      if (workOrder.status !== WorkOrderStatus.REVIEW_SUBMITTED) {
        throw new BusinessException(ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许验证复盘');
      }

      const review = await manager.findOne(ReviewRecord, { where: { workOrderId } });
      if (!review) {
        throw new BusinessException(ErrorCode.REVIEW_NOT_FOUND, '复盘记录不存在');
      }

      if (review.isVerified) {
        throw new BusinessException(ErrorCode.REVIEW_ALREADY_VERIFIED, '复盘已验证');
      }

      review.isVerified = true;
      review.verifiedById = dto.operatorId;
      review.verifiedAt = new Date();
      await manager.save(review);

      workOrder.status = WorkOrderStatus.CLOSED;
      workOrder.closedAt = new Date();
      await manager.save(workOrder);

      const history = manager.create(StatusHistory, {
        workOrderId,
        fromStatus: WorkOrderStatus.REVIEW_SUBMITTED,
        toStatus: WorkOrderStatus.CLOSED,
        remark: dto.remark || '复盘验证通过，工单关闭',
        operatedById: dto.operatorId,
      });
      await manager.save(history);

      return this.findOne(workOrderId);
    });
  }

  private async createStatusHistory(
    workOrderId: string,
    fromStatus: WorkOrderStatus | null,
    toStatus: WorkOrderStatus,
    remark: string,
    operatedById?: string,
  ): Promise<void> {
    const history = this.statusHistoryRepository.create({
      workOrderId,
      fromStatus,
      toStatus,
      remark,
      operatedById,
    });
    await this.statusHistoryRepository.save(history);
  }
}
