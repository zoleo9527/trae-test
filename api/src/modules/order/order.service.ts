import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { createPaginatedResult, PaginatedResult, PaginationParams } from '../../common/pagination';
import { ActivityLogService } from '../../common/activity-log.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll(
    pagination: PaginationParams,
    keyword?: string,
    status?: OrderStatus,
    salesConsultant?: string,
  ): Promise<PaginatedResult<Order>> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (salesConsultant) {
      where.salesConsultant = salesConsultant;
    }

    const [items, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['customer', 'items'],
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    let filteredItems = items;
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredItems = items.filter(
        item =>
          item.orderNo.toLowerCase().includes(lowerKeyword) ||
          item.customer?.name.toLowerCase().includes(lowerKeyword) ||
          item.customer?.phone.includes(keyword),
      );
    }

    return createPaginatedResult(filteredItems, keyword ? filteredItems.length : total, pagination.page, pagination.pageSize);
  }

  async findOne(id: number): Promise<Order> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'appointments', 'acceptanceRecords', 'exceptions', 'sampleLoans'],
    });
  }

  async findByOrderNo(orderNo: string): Promise<Order> {
    return this.orderRepository.findOne({
      where: { orderNo },
      relations: ['customer', 'items', 'appointments', 'acceptanceRecords', 'exceptions', 'sampleLoans'],
    });
  }

  async create(dto: CreateOrderDto, operator: string): Promise<Order> {
    const orderNo = await this.generateOrderNo();
    const order = this.orderRepository.create({
      ...dto,
      orderNo,
      items: dto.items.map(item => this.orderItemRepository.create(item)),
    });
    const saved = await this.orderRepository.save(order);

    await this.activityLogService.log(
      'order',
      saved.id,
      'create',
      `创建订单: ${saved.orderNo}`,
      operator,
      'sales',
      null,
      saved,
    );

    return saved;
  }

  async update(id: number, dto: UpdateOrderDto, operator: string): Promise<Order> {
    const order = await this.findOne(id);
    const oldValue = { ...order };
    Object.assign(order, dto);
    const updated = await this.orderRepository.save(order);

    await this.activityLogService.log(
      'order',
      id,
      'update',
      `更新订单: ${order.orderNo}`,
      operator,
      'sales',
      oldValue,
      updated,
    );

    return updated;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto, operator: string): Promise<Order> {
    const order = await this.findOne(id);
    const oldStatus = order.status;
    order.status = dto.status;
    if (dto.remark) {
      order.remark = (order.remark || '') + '\n' + dto.remark;
    }
    const updated = await this.orderRepository.save(order);

    const statusMap = {
      [OrderStatus.PENDING]: '待确认',
      [OrderStatus.CONFIRMED]: '已确认',
      [OrderStatus.PRODUCING]: '生产中',
      [OrderStatus.DELIVERED]: '已到货',
      [OrderStatus.INSTALLING]: '安装中',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.EXCEPTION]: '异常',
    };

    await this.activityLogService.log(
      'order',
      id,
      'status_change',
      `订单状态变更: ${statusMap[oldStatus]} → ${statusMap[dto.status]}`,
      operator,
      'sales',
      { status: oldStatus },
      { status: dto.status },
    );

    return updated;
  }

  async remove(id: number, operator: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.delete(id);

    await this.activityLogService.log(
      'order',
      id,
      'delete',
      `删除订单: ${order.orderNo}`,
      operator,
      'manager',
      order,
      null,
    );
  }

  async getDashboardStats(): Promise<any> {
    const [allOrders, total] = await this.orderRepository.findAndCount();
    const statusCounts = allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      ...statusCounts,
    };
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const prefix = `FJ${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const lastOrder = await this.orderRepository.findOne({
      where: { orderNo: Like(`${prefix}%`) },
      order: { orderNo: 'DESC' },
    });
    let seq = 1;
    if (lastOrder) {
      seq = parseInt(lastOrder.orderNo.slice(-4)) + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async getActivityLogs(id: number) {
    return this.activityLogService.findByEntity('order', id);
  }
}
