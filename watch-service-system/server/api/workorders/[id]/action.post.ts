import { mockWorkOrders, mockPartInventory, mockUsers } from '../../../data/mockData';
import type { WorkOrder, WorkOrderAction, TimelineEntry, PartLock, RepairProgress, CustomerReceipt, WorkOrderStatus } from '~/types/workorder';

function getCurrentUser(role: string) {
  return mockUsers.find(u => u.role === role) || mockUsers[0];
}

function createTimelineEntry(
  action: string,
  operator: string,
  operatorRole: 'manager' | 'consultant' | 'technician',
  remark?: string
): TimelineEntry {
  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    operator,
    operatorRole,
    remark,
    createdAt: new Date().toISOString(),
  };
}

function createProgressEntry(
  workOrderId: string,
  status: 'inspecting' | 'parts_preparing' | 'repairing' | 'testing' | 'completed',
  description: string,
  operator: string,
  operatorRole: 'manager' | 'consultant' | 'technician'
): RepairProgress {
  return {
    id: `pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId,
    status,
    description,
    operator,
    operatorRole,
    createdAt: new Date().toISOString(),
  };
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { actionType, role = 'technician', ...data } = body as WorkOrderAction & { role?: string };

  const index = mockWorkOrders.findIndex(wo => wo.id === id);

  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在',
    });
  }

  const currentUser = getCurrentUser(role);
  const order = mockWorkOrders[index];
  const timeline: TimelineEntry[] = [...order.timeline];
  let newStatus = order.status;
  let newQuote = order.quote;
  let newParts = order.parts;
  let newProgress = order.progress;
  let newReceipt = order.receipt;
  let updates: Partial<WorkOrder> = {};

  const ALLOWED_STATUS_FOR_ACTION: Record<string, WorkOrderStatus[]> = {
    start_inspect: ['pending_review'],
    lock_parts: ['quoting'],
    release_parts: ['quoting'],
    submit_quote: ['quoting'],
    approve_quote: ['pending_approval'],
    reject_quote: ['pending_approval'],
    send_confirmation: ['pending_confirm'],
    customer_confirm: ['pending_confirm'],
    customer_reject: ['pending_confirm'],
    start_repair: ['ready_for_repair'],
    update_progress: ['quoting', 'repairing'],
    complete_repair: ['repairing'],
    notify_pickup: ['completed'],
    confirm_pickup: ['completed'],
    satisfaction_survey: ['picked_up'],
    reopen: ['rejected', 'customer_rejected', 'completed', 'picked_up'],
    close: ['picked_up'],
  };

  const PROGRESS_STATUS_ALLOWED: Record<string, string[]> = {
    quoting: ['inspecting', 'parts_preparing'],
    repairing: ['repairing', 'testing'],
  };

  const allowedStatuses = ALLOWED_STATUS_FOR_ACTION[actionType];
  if (allowedStatuses && !allowedStatuses.includes(order.status)) {
    throw createError({
      statusCode: 400,
      statusMessage: `当前状态「${order.status}」不允许此操作`,
    });
  }

  if (actionType === 'update_progress') {
    const progressStatus = (data as any).progressStatus || 'repairing';
    const allowedProgress = PROGRESS_STATUS_ALLOWED[order.status];
    if (allowedProgress && !allowedProgress.includes(progressStatus)) {
      throw createError({
        statusCode: 400,
        statusMessage: `当前阶段不允许设置为「${progressStatus}」状态`,
      });
    }
  }

  switch (actionType) {
    case 'start_inspect': {
      newStatus = 'quoting';
      timeline.push(createTimelineEntry('开始检测', currentUser.name, currentUser.role, data.remark));
      newProgress.push(createProgressEntry(id, 'inspecting', '开始检测手表故障', currentUser.name, currentUser.role));
      if (data.inspectionResult) {
        updates.inspectionResult = data.inspectionResult;
      }
      break;
    }

    case 'lock_parts': {
      if (data.parts && data.parts.length > 0) {
        const newPartLocks: PartLock[] = data.parts.map((p, idx) => ({
          id: `pl-${Date.now()}-${idx}`,
          partName: p.partName,
          partCode: p.partCode,
          quantity: p.quantity,
          status: 'locked' as const,
          lockedBy: currentUser.id,
          lockedAt: new Date().toISOString(),
        }));
        newParts = [...order.parts.filter(p => p.status !== 'locked'), ...newPartLocks];

        data.parts.forEach(p => {
          const inv = mockPartInventory.find(i => i.partCode === p.partCode);
          if (inv) {
            inv.locked = Math.min(inv.locked + p.quantity, inv.stock);
          }
        });

        timeline.push(createTimelineEntry('锁定配件', currentUser.name, currentUser.role, `锁定 ${data.parts.length} 种配件`));
        newProgress.push(createProgressEntry(id, 'parts_preparing', '配件已锁定，准备就绪', currentUser.name, currentUser.role));
      }
      break;
    }

    case 'release_parts': {
      newParts = order.parts.map(p => ({
        ...p,
        status: 'released' as const,
      }));

      order.parts.forEach(p => {
        const inv = mockPartInventory.find(i => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });

      timeline.push(createTimelineEntry('释放配件', currentUser.name, currentUser.role, '已释放所有锁定的配件'));
      break;
    }

    case 'submit_quote': {
      newStatus = 'pending_approval';
      if (data.partsCost !== undefined && data.laborCost !== undefined) {
        const amount = data.partsCost + data.laborCost;
        newQuote = {
          id: order.quote?.id || `q-${Date.now()}`,
          workOrderId: id,
          amount,
          partsCost: data.partsCost,
          laborCost: data.laborCost,
          status: 'submitted' as const,
          remark: data.remark,
          createdAt: new Date().toISOString(),
        };
        timeline.push(createTimelineEntry('提交报价', currentUser.name, currentUser.role, `报价金额: ¥${amount}`));
      }
      break;
    }

    case 'approve_quote': {
      newStatus = 'pending_confirm';
      if (newQuote) {
        newQuote = {
          ...newQuote,
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
        };
      }
      timeline.push(createTimelineEntry('审批通过', currentUser.name, currentUser.role, data.remark || '报价合理，同意'));
      break;
    }

    case 'reject_quote': {
      newStatus = 'rejected';
      if (newQuote) {
        newQuote = {
          ...newQuote,
          status: 'rejected' as const,
        };
      }
      newParts = order.parts.map(p => ({
        ...p,
        status: 'released' as const,
      }));
      order.parts.forEach(p => {
        const inv = mockPartInventory.find(i => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      updates.rejectReason = data.rejectReason;
      timeline.push(createTimelineEntry('审批驳回', currentUser.name, currentUser.role, data.rejectReason));
      break;
    }

    case 'send_confirmation': {
      timeline.push(createTimelineEntry('发送客户确认', currentUser.name, currentUser.role, '已通过短信发送报价确认'));
      break;
    }

    case 'customer_confirm': {
      newStatus = 'ready_for_repair';
      if (!newReceipt) {
        newReceipt = {
          id: `receipt-${id}`,
          workOrderId: id,
          confirmed: true,
          pickedUp: false,
          confirmedAt: new Date().toISOString(),
          confirmedBy: order.customer.name,
        };
      } else {
        newReceipt = {
          ...newReceipt,
          confirmed: true,
          confirmedAt: new Date().toISOString(),
          confirmedBy: order.customer.name,
        };
      }
      timeline.push(createTimelineEntry('客户确认', currentUser.name, currentUser.role, '客户确认同意维修，等待技师开始'));
      break;
    }

    case 'customer_reject': {
      newStatus = 'customer_rejected';
      newParts = order.parts.map(p => ({
        ...p,
        status: 'released' as const,
      }));
      order.parts.forEach(p => {
        const inv = mockPartInventory.find(i => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      updates.customerRejectReason = data.rejectReason;
      timeline.push(createTimelineEntry('客户驳回', currentUser.name, currentUser.role, data.rejectReason));
      break;
    }

    case 'start_repair': {
      newStatus = 'repairing';
      timeline.push(createTimelineEntry('开始维修', currentUser.name, currentUser.role, '开始执行维修工作'));
      newProgress.push(createProgressEntry(id, 'repairing', '开始执行维修工作', currentUser.name, currentUser.role));
      break;
    }

    case 'update_progress': {
      const status = (data as any).progressStatus || 'repairing';
      const statusLabels: Record<string, string> = {
        inspecting: '检测中',
        parts_preparing: '配件准备',
        repairing: '维修中',
        testing: '测试中',
      };

      const progressToStatusMap: Record<string, WorkOrderStatus> = {
        inspecting: 'quoting',
        parts_preparing: 'quoting',
        repairing: 'repairing',
        testing: 'repairing',
      };

      const mappedStatus = progressToStatusMap[status];
      if (mappedStatus) {
        newStatus = mappedStatus;
      }

      if (data.remark) {
        newProgress.push(createProgressEntry(id, status as any, data.remark, currentUser.name, currentUser.role));
        const statusLabel = statusLabels[status] || status;
        timeline.push(createTimelineEntry('更新进度', currentUser.name, currentUser.role, `[${statusLabel}] ${data.remark}`));
      }
      break;
    }

    case 'complete_repair': {
      newStatus = 'completed';
      newParts = order.parts.map(p => ({
        ...p,
        status: 'used' as const,
      }));
      order.parts.forEach(p => {
        const inv = mockPartInventory.find(i => i.partCode === p.partCode);
        if (inv) {
          inv.stock = Math.max(0, inv.stock - p.quantity);
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      timeline.push(createTimelineEntry('维修完成', currentUser.name, currentUser.role, '维修完成，检测通过'));
      newProgress.push(createProgressEntry(id, 'completed', '维修完成，检测通过', currentUser.name, currentUser.role));
      break;
    }

    case 'notify_pickup': {
      timeline.push(createTimelineEntry('通知取件', currentUser.name, currentUser.role, '已通过短信通知客户取件'));
      break;
    }

    case 'confirm_pickup': {
      newStatus = 'picked_up';
      if (!newReceipt) {
        newReceipt = {
          id: `receipt-${id}`,
          workOrderId: id,
          confirmed: true,
          pickedUp: true,
          pickedUpAt: new Date().toISOString(),
          pickedUpBy: order.customer.name,
          pickupNote: data.pickupNote,
        };
      } else {
        newReceipt = {
          ...newReceipt,
          pickedUp: true,
          pickedUpAt: new Date().toISOString(),
          pickedUpBy: order.customer.name,
          pickupNote: data.pickupNote,
        };
      }
      timeline.push(createTimelineEntry('客户取件', currentUser.name, currentUser.role, data.pickupNote || '客户已取表'));
      break;
    }

    case 'satisfaction_survey': {
      if (data.satisfaction !== undefined) {
        if (!newReceipt) {
          newReceipt = {
            id: `receipt-${id}`,
            workOrderId: id,
            confirmed: true,
            pickedUp: true,
            satisfaction: data.satisfaction,
            satisfactionComment: data.satisfactionComment,
            satisfactionAt: new Date().toISOString(),
          };
        } else {
          newReceipt = {
            ...newReceipt,
            satisfaction: data.satisfaction,
            satisfactionComment: data.satisfactionComment,
            satisfactionAt: new Date().toISOString(),
          };
        }
        timeline.push(createTimelineEntry('满意度回访', currentUser.name, currentUser.role, `满意度: ${data.satisfaction}星 ${data.satisfactionComment || ''}`));
      }
      break;
    }

    case 'reopen': {
      newStatus = 'pending_review';
      timeline.push(createTimelineEntry('重新处理', currentUser.name, currentUser.role, data.remark || '工单已重新打开'));
      break;
    }

    case 'close': {
      timeline.push(createTimelineEntry('关闭工单', currentUser.name, currentUser.role, data.remark || '工单已关闭'));
      break;
    }

    default:
      throw createError({
        statusCode: 400,
        statusMessage: '不支持的操作类型',
      });
  }

  const updatedOrder: WorkOrder = {
    ...order,
    ...updates,
    status: newStatus,
    quote: newQuote,
    parts: newParts,
    progress: newProgress,
    receipt: newReceipt,
    timeline,
    updatedAt: new Date().toISOString(),
  };

  mockWorkOrders[index] = updatedOrder;

  return updatedOrder;
});
