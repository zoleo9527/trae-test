import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateCompensationDto, UpdateCompensationDto } from './compensation.dto';
import * as uuid from 'uuid';

@Injectable()
export class CompensationService {
  constructor(private db: DbService) {}

  async findByWorkOrderId(workOrderId: string): Promise<any> {
    return this.db.findOne('compensations', { workOrderId });
  }

  async create(workOrderId: string, createDto: CreateCompensationDto, operator: any): Promise<any> {
    const workOrder = this.db.findById('workOrders', workOrderId);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const existing = this.db.findOne('compensations', { workOrderId });
    if (existing) {
      return this.update(workOrderId, createDto as any, operator);
    }

    const compensation = await this.db.create('compensations', {
      id: uuid.v4(),
      workOrderId,
      ...createDto,
      status: 'pending',
    });

    await this.db.update('workOrders', workOrderId, { status: 'reviewing' });

    return compensation;
  }

  async update(workOrderId: string, updateDto: UpdateCompensationDto, operator: any): Promise<any> {
    const compensation = this.db.findOne('compensations', { workOrderId });
    if (!compensation) {
      throw new NotFoundException('赔付记录不存在');
    }

    const updates: any = {};

    if (updateDto.status) {
      updates.status = updateDto.status;

      if (updateDto.status === 'approved') {
        updates.approvedAt = new Date().toISOString();
        updates.approvedBy = operator?.name || updateDto.approvedBy;
      }

      if (updateDto.status === 'paid') {
        updates.paidAt = new Date().toISOString();
      }
    }

    if (updateDto.ownerReview) {
      updates.ownerReview = updateDto.ownerReview;
    }

    if (updateDto.type) updates.type = updateDto.type;
    if (updateDto.amount !== undefined) updates.amount = updateDto.amount;
    if (updateDto.reason) updates.reason = updateDto.reason;
    if (updateDto.customerCost !== undefined) updates.customerCost = updateDto.customerCost;
    if (updateDto.labCost !== undefined) updates.labCost = updateDto.labCost;

    return this.db.update('compensations', compensation.id, updates);
  }

  async findAll(query?: any): Promise<any[]> {
    let list = this.db.findAll('compensations');

    if (query?.status) {
      list = list.filter((item) => item.status === query.status);
    }

    if (query?.type) {
      list = list.filter((item) => item.type === query.type);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
