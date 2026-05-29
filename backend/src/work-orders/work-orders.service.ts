import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, BatchUpdateDto, AddNoteDto } from './work-order.dto';
import * as uuid from 'uuid';

@Injectable()
export class WorkOrdersService {
  constructor(private db: DbService) {}

  private enrichWorkOrder(workOrder: any, user?: any): any {
    if (!workOrder) return null;

    let notes = this.db.find('notes', { workOrderId: workOrder.id });
    if (user?.role !== 'owner') {
      notes = notes.filter((n: any) => !n.isPrivate);
    }

    const stripUser = (u: any) => {
      if (!u) return undefined;
      const { password, ...safeUser } = u;
      return safeUser;
    };

    return {
      ...workOrder,
      filmRoll: workOrder.filmRollId ? this.db.findById('filmRolls', workOrder.filmRollId) : undefined,
      assignee: workOrder.assigneeId ? stripUser(this.db.findById('users', workOrder.assigneeId)) : undefined,
      statusLogs: this.db.find('statusLogs', { workOrderId: workOrder.id }),
      notes,
      compensation: this.db.findOne('compensations', { workOrderId: workOrder.id }),
    };
  }

  async findAll(query?: any, user?: any): Promise<any[]> {
    let list = this.db.findAll('workOrders');

    if (query?.status) {
      list = list.filter((item) => item.status === query.status);
    }

    if (query?.category) {
      list = list.filter((item) => item.category === query.category);
    }

    if (query?.problemType) {
      list = list.filter((item) => item.problemType === query.problemType);
    }

    if (query?.assigneeId) {
      list = list.filter((item) => item.assigneeId === query.assigneeId);
    }

    if (query?.myOnly === 'true' && user) {
      list = list.filter((item) => item.assigneeId === user.id);
    }

    if (query?.search) {
      const kw = query.search.toLowerCase();
      list = list.filter((item) => {
        const matchOrderNumber = item.orderNumber?.toLowerCase().includes(kw);
        const matchTitle = item.title?.toLowerCase().includes(kw);
        const filmRoll = item.filmRollId ? this.db.findById('filmRolls', item.filmRollId) : null;
        const matchRollNumber = filmRoll?.rollNumber?.toLowerCase().includes(kw);
        const matchCustomer = filmRoll?.customerName?.toLowerCase().includes(kw);
        return matchOrderNumber || matchTitle || matchRollNumber || matchCustomer;
      });
    }

    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((wo) => this.enrichWorkOrder(wo, user));
  }

  async findOne(id: string, user?: any): Promise<any> {
    const workOrder = this.db.findById('workOrders', id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    return this.enrichWorkOrder(workOrder, user);
  }

  async create(createDto: CreateWorkOrderDto, operator: any): Promise<any> {
    const orderNumber = this.generateOrderNumber();

    const workOrder = await this.db.create('workOrders', {
      id: uuid.v4(),
      ...createDto,
      orderNumber,
      status: 'pending',
      assigneeId: operator?.id,
    });

    await this.addStatusLog(workOrder.id, null, 'pending', '工单创建', operator);

    return this.findOne(workOrder.id, operator);
  }

  async update(id: string, updateDto: UpdateWorkOrderDto, operator: any): Promise<any> {
    const workOrder = await this.findOne(id, operator);

    if (updateDto.status && updateDto.status !== workOrder.status) {
      await this.addStatusLog(id, workOrder.status, updateDto.status, updateDto.remark, operator);

      const statusUpdates: any = { status: updateDto.status };

      if (updateDto.status === 'completed' || updateDto.status === 'closed') {
        statusUpdates.closedAt = new Date().toISOString();
      }

      if (updateDto.status === 'approved') {
        statusUpdates.ownerReviewedAt = new Date().toISOString();

        const compensation = this.db.findOne('compensations', { workOrderId: id });
        if (compensation) {
          await this.db.update('compensations', compensation.id, {
            approvedAt: new Date().toISOString(),
            approvedBy: operator?.name,
            approvedByRole: operator?.role,
            ownerReview: updateDto.reviewConclusion || compensation.ownerReview,
            status: 'approved',
          });

          await this.db.update('workOrders', id, {
            reviewConclusion: updateDto.reviewConclusion || workOrder.reviewConclusion,
          });

          await this.db.create('notes', {
            id: uuid.v4(),
            workOrderId: id,
            content: `赔付方案已批准，金额 ¥${compensation.amount}。${updateDto.reviewConclusion ? '复核意见：' + updateDto.reviewConclusion : ''}`,
            type: 'review',
            isPrivate: false,
            creatorId: operator?.id,
            creatorName: operator?.name,
            creatorRole: operator?.role,
          });
        }
      }

      if (updateDto.status === 'closed') {
        const compensation = this.db.findOne('compensations', { workOrderId: id });
        if (compensation) {
          await this.db.update('compensations', compensation.id, {
            rejectedAt: new Date().toISOString(),
            rejectedBy: operator?.name,
            rejectReason: updateDto.remark || '',
            status: 'rejected',
          });

          await this.db.create('notes', {
            id: uuid.v4(),
            workOrderId: id,
            content: `赔付申请被拒绝。${updateDto.remark ? '原因：' + updateDto.remark : ''}`,
            type: 'review',
            isPrivate: false,
            creatorId: operator?.id,
            creatorName: operator?.name,
            creatorRole: operator?.role,
          });
        }
      }

      await this.db.update('workOrders', id, statusUpdates);
    }

    const updates: any = {};
    if (updateDto.assigneeId) updates.assigneeId = updateDto.assigneeId;
    if (updateDto.title) updates.title = updateDto.title;
    if (updateDto.description) updates.description = updateDto.description;
    if (updateDto.negotiationSummary) updates.negotiationSummary = updateDto.negotiationSummary;
    if (updateDto.reviewConclusion && updateDto.status !== 'approved') updates.reviewConclusion = updateDto.reviewConclusion;

    if (Object.keys(updates).length > 0) {
      await this.db.update('workOrders', id, updates);
    }

    return this.findOne(id, operator);
  }

  async batchUpdate(batchDto: BatchUpdateDto, operator: any): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of batchDto.ids) {
      try {
        await this.update(
          id,
          {
            status: batchDto.status as any,
            remark: batchDto.remark,
            assigneeId: batchDto.assigneeId,
          },
          operator,
        );
        success++;
      } catch (e) {
        failed++;
      }
    }

    return { success, failed };
  }

  async addNote(id: string, noteDto: AddNoteDto, creator: any): Promise<any> {
    await this.findOne(id);

    const note = await this.db.create('notes', {
      id: uuid.v4(),
      workOrderId: id,
      content: noteDto.content,
      type: noteDto.type || 'internal',
      isPrivate: noteDto.isPrivate || false,
      creatorId: creator?.id,
      creatorName: creator?.name,
      creatorRole: creator?.role,
    });

    return note;
  }

  async getNotes(id: string, userRole?: string): Promise<any[]> {
    let notes = this.db.find('notes', { workOrderId: id });

    if (userRole === 'customer_service') {
      notes = notes.filter((n) => !n.isPrivate);
    }

    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStatusLogs(id: string): Promise<any[]> {
    return this.db
      .find('statusLogs', { workOrderId: id })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  private async addStatusLog(
    workOrderId: string,
    fromStatus: string | null,
    toStatus: string,
    remark: string,
    operator: any,
  ): Promise<any> {
    return this.db.create('statusLogs', {
      id: uuid.v4(),
      workOrderId,
      fromStatus: fromStatus || 'none',
      toStatus,
      remark: remark || '',
      operatorId: operator?.id,
      operatorName: operator?.name,
      operatorRole: operator?.role,
    });
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const prefix = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  async getStats(): Promise<any> {
    const all = this.db.findAll('workOrders');
    const countBy = (field: string, value: string) => all.filter((item) => item[field] === value).length;

    return {
      total: all.length,
      byStatus: {
        pending: countBy('status', 'pending'),
        negotiating: countBy('status', 'negotiating'),
        reviewing: countBy('status', 'reviewing'),
        approved: countBy('status', 'approved'),
        completed: countBy('status', 'completed'),
        closed: countBy('status', 'closed'),
      },
      byProblemType: {
        mixedRoll: countBy('problemType', 'mixed_roll'),
        wrongVersion: countBy('problemType', 'wrong_version'),
      },
    };
  }
}
