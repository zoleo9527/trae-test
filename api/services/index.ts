import {
  collectionRepo,
  orderRepo,
  rescheduleRepo,
  retouchRepo,
  timelineRepo,
} from '../repositories/index.js';
import type { OrderStatus, Role } from '../types.js';
import { ROLES } from '../types.js';

export function roleName(role: Role): string {
  return ROLES.find(r => r.key === role)?.name ?? role;
}

export const timelineService = {
  record(
    orderId: string,
    type: 'status' | 'reschedule' | 'collection' | 'note' | 'retouch',
    payload: any,
    actorRole: Role,
    actorName?: string,
  ) {
    return timelineRepo.insert({
      order_id: orderId,
      type,
      actor_role: actorRole,
      actor_name: actorName ?? roleName(actorRole),
      at: new Date().toISOString(),
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    });
  },
};

export const orderService = {
  list(filters?: { status?: string; keyword?: string; from?: string; to?: string }) {
    return orderRepo.list(filters);
  },

  detail(id: string) {
    const order = orderRepo.findById(id);
    if (!order) return null;
    return {
      order,
      timeline: timelineRepo.listByOrder(id),
      reschedules: rescheduleRepo.listByOrder(id),
      collections: collectionRepo.listByOrder(id),
      retouches: retouchRepo.listByOrder(id),
    };
  },

  addNote(id: string, content: string, actorRole: Role, actorName?: string) {
    const order = orderRepo.findById(id);
    if (!order) return null;
    return timelineService.record(id, 'note', { content }, actorRole, actorName);
  },
};

export const rescheduleService = {
  create(
    orderId: string,
    body: { from: string; to: string; reason: string },
    actorRole: Role,
    actorName?: string,
  ) {
    const order = orderRepo.findById(orderId);
    if (!order) return { error: '订单不存在' };
    const id = rescheduleRepo.insert({
      order_id: orderId,
      suggested_from: body.from,
      suggested_to: body.to,
      reason: body.reason,
      status: 'pending',
      approver_role: null,
      approver_name: null,
      approved_at: null,
      reject_reason: null,
      created_at: new Date().toISOString(),
    });
    if (order.status !== 'rescheduling') {
      orderRepo.update(orderId, { status: 'rescheduling' });
      timelineService.record(
        orderId,
        'status',
        { from: order.status, to: 'rescheduling', note: '进入改期流程' },
        actorRole,
        actorName,
      );
    }
    timelineService.record(
      orderId,
      'reschedule',
      { reschedule_id: id, action: 'created', from: body.from, to: body.to, reason: body.reason },
      actorRole,
      actorName,
    );
    orderRepo.update(orderId, { current_reschedule_id: id });
    return { id };
  },

  review(
    id: string,
    body: { action: 'approve' | 'reject'; rejectReason?: string },
    actorRole: Role,
    actorName?: string,
  ) {
    const rs = rescheduleRepo.findById(id);
    if (!rs) return { error: '申请不存在' };
    if (rs.status !== 'pending') return { error: '申请已处理' };
    const now = new Date().toISOString();
    if (body.action === 'approve') {
      rescheduleRepo.update(id, {
        status: 'approved',
        approver_role: actorRole,
        approver_name: actorName ?? roleName(actorRole),
        approved_at: now,
      });
      timelineService.record(
        rs.order_id,
        'reschedule',
        { reschedule_id: id, action: 'approved' },
        actorRole,
        actorName,
      );
      const order = orderRepo.findById(rs.order_id);
      const newStatus: OrderStatus = order && order.select_date ? 'selected' : 'scheduled';
      orderRepo.update(rs.order_id, {
        shoot_date: rs.suggested_to,
        status: newStatus,
        current_reschedule_id: null,
      });
      timelineService.record(
        rs.order_id,
        'status',
        {
          from: 'rescheduling',
          to: newStatus,
          note: `改期确认，新档期 ${rs.suggested_to}`,
        },
        actorRole,
        actorName,
      );
    } else {
      rescheduleRepo.update(id, {
        status: 'rejected',
        approver_role: actorRole,
        approver_name: actorName ?? roleName(actorRole),
        reject_reason: body.rejectReason ?? null,
      });
      timelineService.record(
        rs.order_id,
        'reschedule',
        { reschedule_id: id, action: 'rejected', reject_reason: body.rejectReason ?? '' },
        actorRole,
        actorName,
      );
      orderRepo.update(rs.order_id, { current_reschedule_id: null });
    }
    return { id };
  },
};

export const collectionService = {
  create(
    orderId: string,
    body: { method: 'auto' | 'phone' | 'wechat'; result: string; remark?: string; paidAmount?: number },
    actorRole: Role,
    actorName?: string,
  ) {
    const order = orderRepo.findById(orderId);
    if (!order) return { error: '订单不存在' };
    const id = collectionRepo.insert({
      order_id: orderId,
      method: body.method,
      result: body.result as any,
      remark: body.remark ?? null,
      actor_role: actorRole,
      actor_name: actorName ?? roleName(actorRole),
      created_at: new Date().toISOString(),
    });
    timelineService.record(
      orderId,
      'collection',
      {
        collection_id: id,
        method: body.method,
        result: body.result,
        remark: body.remark ?? '',
      },
      actorRole,
      actorName,
    );

    if (body.result === 'paid') {
      const nextPaid = body.paidAmount != null ? body.paidAmount : order.total_amount;
      orderRepo.update(orderId, { paid_amount: nextPaid, status: 'completed' });
      timelineService.record(
        orderId,
        'status',
        { from: order.status, to: 'completed', note: '尾款已结清' },
        actorRole,
        actorName,
      );
    } else if (body.result === 'escalated') {
      orderRepo.update(orderId, { collection_level: 3, status: 'overdue' });
      timelineService.record(
        orderId,
        'status',
        { from: order.status, to: 'overdue', note: '升级为店长介入催收' },
        actorRole,
        actorName,
      );
    }

    return { id };
  },

  update(id: string, body: { result?: string; remark?: string }, actorRole: Role, actorName?: string) {
    const rec = collectionRepo.findById(id);
    if (!rec) return { error: '记录不存在' };
    const patch: Partial<import('../types.js').CollectionRow> = {};
    if (body.result) patch.result = body.result as any;
    if (body.remark !== undefined) patch.remark = body.remark;
    collectionRepo.update(id, patch);
    timelineService.record(
      rec.order_id,
      'collection',
      { collection_id: id, action: 'updated', result: body.result, remark: body.remark },
      actorRole,
      actorName,
    );
    return { id };
  },
};
