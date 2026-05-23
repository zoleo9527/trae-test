import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like, In } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { StatusHistory } from '../../entities/status-history.entity';
import { User } from '../../entities/user.entity';
import { WorkOrderStatus, WorkOrderStatusFlow } from '../../common/enums/work-order.enum';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';
import { CreateWorkOrderDto, UpdateWorkOrderDto, QueryWorkOrderDto, TransitionStatusDto, AssignHandlerDto } from './dto/work-order.dto';
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
      throw new BusinessException('工单不存在', ErrorCode.WORK_ORDER_NOT_FOUND);
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
      throw new BusinessException('处理人不存在', ErrorCode.USER_NOT_FOUND);
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
        throw new BusinessException('工单不存在', ErrorCode.WORK_ORDER_NOT_FOUND);
      }

      const currentStatus = workOrder.status;
      const targetStatus = transitionDto.targetStatus;

      if (!this.canTransition(currentStatus, targetStatus)) {
        throw new BusinessException(
          `无法从 ${currentStatus} 转换到 ${targetStatus}`,
          ErrorCode.INVALID_STATUS_TRANSITION,
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
