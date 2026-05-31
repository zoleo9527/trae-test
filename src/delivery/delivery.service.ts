import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { User } from '../user/entities/user.entity';
import { AuditAction, AuditEntityType } from '../common/enums/audit.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    private auditService: AuditService,
  ) {}

  private generateDeliveryNumber(): string {
    const date = new Date();
    const prefix = `DL-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${random}`;
  }

  async create(createDto: CreateDeliveryDto, user: User): Promise<Delivery> {
    const delivery = this.deliveryRepository.create({
      ...createDto,
      deliveryNumber: this.generateDeliveryNumber(),
      createdById: user.id,
      createdBy: user,
    });

    const saved = await this.deliveryRepository.save(delivery);

    await this.auditService.createLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.DELIVERY,
      entityId: saved.id,
      entityName: saved.deliveryNumber,
      user,
      newValues: saved,
      description: '创建发货回单',
    });

    return this.findOne(saved.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      projectId?: string;
      status?: DeliveryStatus;
    },
  ): Promise<{ data: Delivery[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.deliveryRepository.createQueryBuilder('d')
      .leftJoinAndSelect('d.createdBy', 'createdBy')
      .leftJoinAndSelect('d.receivedBy', 'receivedBy')
      .leftJoinAndSelect('d.changeOrder', 'changeOrder');

    if (filters?.projectId) {
      queryBuilder.andWhere('d.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('d.status = :status', { status: filters.status });
    }

    const [data, total] = await queryBuilder
      .orderBy('d.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['createdBy', 'receivedBy', 'changeOrder', 'signOffs'],
    });

    if (!delivery) {
      throw new NotFoundException('发货回单不存在');
    }

    return delivery;
  }

  async update(id: string, updateDto: UpdateDeliveryDto, user: User): Promise<Delivery> {
    const delivery = await this.findOne(id);
    const oldValues = { ...delivery };

    Object.assign(delivery, updateDto);
    const saved = await this.deliveryRepository.save(delivery);

    await this.auditService.createLog({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.DELIVERY,
      entityId: id,
      entityName: saved.deliveryNumber,
      user,
      oldValues,
      newValues: saved,
      description: '更新发货回单',
    });

    return this.findOne(id);
  }

  async receive(id: string, user: User): Promise<Delivery> {
    const delivery = await this.findOne(id);
    const oldValues = { status: delivery.status };

    delivery.status = DeliveryStatus.RECEIVED;
    delivery.receivedById = user.id;
    delivery.receivedBy = user;
    delivery.actualDeliveryDate = new Date();

    const saved = await this.deliveryRepository.save(delivery);

    await this.auditService.createLog({
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.DELIVERY,
      entityId: id,
      entityName: saved.deliveryNumber,
      user,
      oldValues,
      newValues: { status: DeliveryStatus.RECEIVED },
      description: '确认收货',
    });

    return this.findOne(id);
  }

  async findByChangeOrder(changeOrderId: string): Promise<Delivery[]> {
    return this.deliveryRepository.find({
      where: { changeOrderId },
      relations: ['createdBy', 'receivedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
