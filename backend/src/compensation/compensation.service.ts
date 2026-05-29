import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateCompensationDto, UpdateCompensationDto } from './compensation.dto';
import * as uuid from 'uuid';

@Injectable()
export class CompensationService {
  constructor(private db: DbService) {}

  private readonly PRINTER_PROBLEM_TYPES = ['mixed_roll', 'quality_issue'];
  private readonly CS_ALLOWED_STATUSES = ['pending', 'negotiating', 'approved', 'completed'];
  private readonly CS_EDIT_ALLOWED_STATUSES = ['pending', 'negotiating'];

  private checkCompensationAccess(workOrder: any, user: any): boolean {
    if (!workOrder || !user) return false;
    if (user.role === 'owner') return true;

    if (user.role === 'customer_service') {
      return workOrder.assigneeId === user.id && this.CS_ALLOWED_STATUSES.includes(workOrder.status);
    }

    if (user.role === 'printer') {
      return this.PRINTER_PROBLEM_TYPES.includes(workOrder.problemType);
    }

    return false;
  }

  private checkCompensationEditPermission(workOrder: any, user: any): boolean {
    if (!workOrder || !user) return false;
    if (user.role === 'owner') return true;

    if (user.role === 'customer_service') {
      return (
        workOrder.assigneeId === user.id &&
        this.CS_EDIT_ALLOWED_STATUSES.includes(workOrder.status)
      );
    }

    return false;
  }

  private filterByRole(list: any[], user: any): any[] {
    if (!user) return [];
    if (user.role === 'owner') return list;

    const workOrders = this.db.findAll('workOrders');
    return list.filter((comp) => {
      const wo = workOrders.find((w: any) => w.id === comp.workOrderId);
      return wo && this.checkCompensationAccess(wo, user);
    });
  }

  async findAll(query?: any, user?: any): Promise<any[]> {
    let list = this.db.findAll('compensations');

    if (query?.status) {
      list = list.filter((item) => item.status === query.status);
    }

    if (query?.type) {
      list = list.filter((item) => item.type === query.type);
    }

    return this.filterByRole(list, user).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findByWorkOrderId(workOrderId: string, user?: any): Promise<any> {
    const workOrder = this.db.findById('workOrders', workOrderId);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    if (!this.checkCompensationAccess(workOrder, user)) {
      throw new ForbiddenException('无权访问该赔付记录');
    }
    return this.db.findOne('compensations', { workOrderId });
  }

  async create(workOrderId: string, createDto: CreateCompensationDto, operator: any): Promise<any> {
    const workOrder = this.db.findById('workOrders', workOrderId);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    if (!this.checkCompensationEditPermission(workOrder, operator)) {
      throw new ForbiddenException('无权创建该工单的赔付方案');
    }

    const existing = this.db.findOne('compensations', { workOrderId });
    if (existing) {
      return this.update(workOrderId, createDto as any, operator);
    }

    const compensation = await this.db.create('compensations', {
      id: uuid.v4(),
      workOrderId,
      ...createDto,
      createdBy: operator?.name,
      createdByRole: operator?.role,
      status: 'pending',
    });

    await this.db.update('workOrders', workOrderId, { status: 'reviewing' });

    return compensation;
  }

  async update(workOrderId: string, updateDto: UpdateCompensationDto, operator: any): Promise<any> {
    const workOrder = this.db.findById('workOrders', workOrderId);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    if (!this.checkCompensationEditPermission(workOrder, operator)) {
      throw new ForbiddenException('无权修改该工单的赔付方案');
    }

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
}
