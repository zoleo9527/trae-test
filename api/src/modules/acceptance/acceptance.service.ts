import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcceptanceRecord, AcceptanceStatus } from '../../entities/acceptance-record.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { CreateAcceptanceDto, UpdateAcceptanceDto, CompleteRectificationDto } from './acceptance.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class AcceptanceService {
  constructor(
    @InjectRepository(AcceptanceRecord)
    private readonly acceptanceRepository: Repository<AcceptanceRecord>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    status?: AcceptanceStatus,
  ): Promise<PaginatedResult<AcceptanceRecord>> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.acceptanceRepository.findAndCount({
      where,
      relations: ['order', 'order.customer'],
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: number): Promise<AcceptanceRecord> {
    return this.acceptanceRepository.findOne({
      where: { id },
      relations: ['order', 'order.customer', 'order.items'],
    });
  }

  async findByOrderId(orderId: number): Promise<AcceptanceRecord[]> {
    return this.acceptanceRepository.find({
      where: { orderId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateAcceptanceDto, operator: string): Promise<AcceptanceRecord> {
    const hasIssues = dto.qualityIssues || dto.installationIssues || dto.missingItems;
    const status = hasIssues ? AcceptanceStatus.FAILED : AcceptanceStatus.PASSED;

    const acceptance = this.acceptanceRepository.create({
      ...dto,
      status,
      inspectionTime: new Date(),
    });
    const saved = await this.acceptanceRepository.save(acceptance);

    const order = await this.orderRepository.findOneBy({ id: dto.orderId });
    if (order && status === AcceptanceStatus.PASSED) {
      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    } else if (order && status === AcceptanceStatus.FAILED) {
      order.status = OrderStatus.EXCEPTION;
      await this.orderRepository.save(order);
    }

    await this.activityLogService.log(
      'acceptance',
      saved.id,
      'create',
      `创建验收回单: ${status === AcceptanceStatus.PASSED ? '验收通过' : '验收未通过'}`,
      operator,
      'inspector',
      null,
      saved,
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateAcceptanceDto, operator: string): Promise<AcceptanceRecord> {
    const acceptance = await this.findOne(id);
    const oldValue = { ...acceptance };
    Object.assign(acceptance, dto);
    const updated = await this.acceptanceRepository.save(acceptance);

    await this.activityLogService.log(
      'acceptance',
      id,
      'update',
      `更新验收回单`,
      operator,
      'inspector',
      oldValue,
      updated,
    );

    return updated;
  }

  async submitAcceptance(id: number, dto: CreateAcceptanceDto, operator: string): Promise<AcceptanceRecord> {
    const acceptance = await this.findOne(id);
    const hasIssues = dto.qualityIssues || dto.installationIssues || dto.missingItems;
    const status = hasIssues ? AcceptanceStatus.FAILED : AcceptanceStatus.PASSED;

    Object.assign(acceptance, dto, { status, inspectionTime: new Date() });
    const updated = await this.acceptanceRepository.save(acceptance);

    const order = await this.orderRepository.findOneBy({ id: acceptance.orderId });
    if (order && status === AcceptanceStatus.PASSED) {
      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    } else if (order && status === AcceptanceStatus.FAILED) {
      order.status = OrderStatus.EXCEPTION;
      await this.orderRepository.save(order);
    }

    await this.activityLogService.log(
      'acceptance',
      id,
      'submit',
      `提交验收结果: ${status === AcceptanceStatus.PASSED ? '验收通过' : '验收未通过'}`,
      operator,
      'inspector',
      null,
      updated,
    );

    return updated;
  }

  async completeRectification(id: number, dto: CompleteRectificationDto, operator: string): Promise<AcceptanceRecord> {
    const acceptance = await this.findOne(id);
    acceptance.status = AcceptanceStatus.RECTIFIED;
    acceptance.rectificationCompletedAt = new Date();
    acceptance.customerFeedback = dto.rectificationResult;
    if (dto.satisfactionScore) {
      acceptance.satisfactionScore = dto.satisfactionScore;
    }
    const updated = await this.acceptanceRepository.save(acceptance);

    const order = await this.orderRepository.findOneBy({ id: acceptance.orderId });
    if (order) {
      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    }

    await this.activityLogService.log(
      'acceptance',
      id,
      'rectify',
      `整改完成: ${dto.rectificationResult}`,
      operator,
      'inspector',
      null,
      updated,
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const acceptance = await this.findOne(id);
    await this.acceptanceRepository.delete(id);

    await this.activityLogService.log(
      'acceptance',
      id,
      'delete',
      `删除验收回单`,
      operator,
      'manager',
      acceptance,
      null,
    );
  }
}
