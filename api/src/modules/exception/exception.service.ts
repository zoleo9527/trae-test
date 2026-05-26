import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExceptionOrder, ExceptionType, ExceptionStatus } from '../../entities/exception-order.entity';
import { RepairPart, RepairPartStatus } from '../../entities/repair-part.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { CreateExceptionDto, UpdateExceptionDto } from './exception.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class ExceptionService {
  constructor(
    @InjectRepository(ExceptionOrder)
    private readonly exceptionRepository: Repository<ExceptionOrder>,
    @InjectRepository(RepairPart)
    private readonly repairPartRepository: Repository<RepairPart>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    status?: ExceptionStatus,
    type?: ExceptionType,
    assignee?: string,
  ): Promise<PaginatedResult<ExceptionOrder>> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (assignee) {
      where.assignee = assignee;
    }

    const [items, total] = await this.exceptionRepository.findAndCount({
      where,
      relations: ['order', 'order.customer', 'repairParts'],
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: number): Promise<ExceptionOrder> {
    return this.exceptionRepository.findOne({
      where: { id },
      relations: ['order', 'order.customer', 'order.items', 'repairParts'],
    });
  }

  async findByOrderId(orderId: number): Promise<ExceptionOrder[]> {
    return this.exceptionRepository.find({
      where: { orderId },
      relations: ['repairParts'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateExceptionDto, operator: string): Promise<ExceptionOrder> {
    const exception = this.exceptionRepository.create({
      ...dto,
      repairParts: dto.repairParts?.map(p => this.repairPartRepository.create(p)) || [],
    });
    const saved = await this.exceptionRepository.save(exception);

    const order = await this.orderRepository.findOneBy({ id: dto.orderId });
    if (order && order.status !== OrderStatus.EXCEPTION) {
      order.status = OrderStatus.EXCEPTION;
      await this.orderRepository.save(order);
    }

    const typeMap = {
      [ExceptionType.SAMPLE_NOT_RETURNED]: '样品未归还',
      [ExceptionType.MISSING_PARTS]: '缺件',
      [ExceptionType.QUALITY_ISSUE]: '质量问题',
      [ExceptionType.INSTALLATION_PROBLEM]: '安装问题',
      [ExceptionType.CUSTOMER_COMPLAINT]: '客户投诉',
      [ExceptionType.DELIVERY_DELAY]: '发货延迟',
      [ExceptionType.CUSTOM_CONFIG_ISSUE]: '定制配置问题',
      [ExceptionType.OTHER]: '其他',
    };

    await this.activityLogService.log(
      'exception',
      saved.id,
      'create',
      `创建异常单 [${typeMap[dto.type]}]: ${dto.title}`,
      operator,
      dto.assignee || 'coordinator',
      null,
      saved,
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateExceptionDto, operator: string): Promise<ExceptionOrder> {
    const exception = await this.findOne(id);
    const oldValue = { ...exception };
    Object.assign(exception, dto);

    if (dto.status === ExceptionStatus.RESOLVED) {
      exception.resolvedAt = new Date();
      const order = await this.orderRepository.findOneBy({ id: exception.orderId });
      if (order && order.status === OrderStatus.EXCEPTION) {
        const hasOpenException = await this.exceptionRepository.findOne({
          where: { orderId: exception.orderId, status: ExceptionStatus.OPEN },
        });
        if (!hasOpenException) {
          order.status = OrderStatus.INSTALLING;
          await this.orderRepository.save(order);
        }
      }
    }

    const updated = await this.exceptionRepository.save(exception);

    await this.activityLogService.log(
      'exception',
      id,
      'update',
      `更新异常单`,
      operator,
      dto.assignee || exception.assignee || 'coordinator',
      oldValue,
      updated,
    );

    return updated;
  }

  async updateRepairPartStatus(repairPartId: number, status: RepairPartStatus, operator: string): Promise<RepairPart> {
    const repairPart = await this.repairPartRepository.findOneBy({ id: repairPartId });
    const oldValue = { ...repairPart };
    repairPart.status = status;

    if (status === RepairPartStatus.RECEIVED) {
      repairPart.actualDeliveryDate = new Date();
    }

    const updated = await this.repairPartRepository.save(repairPart);

    await this.activityLogService.log(
      'repair_part',
      repairPartId,
      'status_change',
      `补件状态更新: ${repairPart.partName}`,
      operator,
      'coordinator',
      oldValue,
      updated,
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const exception = await this.findOne(id);
    await this.exceptionRepository.delete(id);

    await this.activityLogService.log(
      'exception',
      id,
      'delete',
      `删除异常单: ${exception.title}`,
      operator,
      'manager',
      exception,
      null,
    );
  }
}
