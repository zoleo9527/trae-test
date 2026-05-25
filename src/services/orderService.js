import { v4 as uuidv4 } from 'uuid';
import { orders, performances, tasks, notifications, users } from '../data/database.js';
import { ORDER_STATUS, TASK_TYPE, TASK_STATUS, ROLES } from '../data/models.js';

export const getAllOrders = (filters = {}) => {
  let result = [...orders];
  
  if (filters.status) {
    result = result.filter(o => o.status === filters.status);
  }
  if (filters.performanceId) {
    result = result.filter(o => o.performanceId === filters.performanceId);
  }
  if (filters.chainId) {
    result = result.filter(o => o.chainId === filters.chainId);
  }
  
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getOrderById = (id) => {
  return orders.find(o => o.id === id);
};

export const createOrder = (data, userId) => {
  const performance = performances.find(p => p.id === data.performanceId);
  
  if (!performance) {
    throw new Error('演出不存在');
  }
  
  const newOrder = {
    id: `order-${uuidv4().slice(0, 8)}`,
    ...data,
    chainId: performance.chainId,
    orderNo: `TG${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(orders.length + 1).padStart(3, '0')}`,
    status: ORDER_STATUS.PENDING,
    paidAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
    settlementStatus: 'pending'
  };
  
  orders.push(newOrder);
  
  return newOrder;
};

export const updateOrder = (id, data, userId) => {
  const index = orders.findIndex(o => o.id === id);
  
  if (index === -1) {
    throw new Error('订单不存在');
  }
  
  orders[index] = {
    ...orders[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return orders[index];
};

export const updateOrderStatus = (id, status, userId) => {
  const index = orders.findIndex(o => o.id === id);
  
  if (index === -1) {
    throw new Error('订单不存在');
  }
  
  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  
  return orders[index];
};

export const requestRefund = (orderId, refundAmount, refundReason, ticketCount, userId) => {
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  const refundTask = {
    id: `task-${uuidv4().slice(0, 8)}`,
    chainId: order.chainId,
    performanceId: order.performanceId,
    type: TASK_TYPE.REFUND_REQUEST,
    title: `${order.groupName}退票申请`,
    description: refundReason,
    orderId: order.id,
    status: TASK_STATUS.PENDING,
    priority: 'high',
    assigneeRole: ROLES.TICKET_SUPERVISOR,
    assignee: null,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
      { action: 'refund_requested', userId, timestamp: new Date().toISOString(), remark: refundReason }
    ],
    refundAmount,
    refundReason,
    refundTicketCount: ticketCount
  };
  
  tasks.push(refundTask);
  
  const ticketSupervisor = users.find(u => u.role === ROLES.TICKET_SUPERVISOR);
  if (ticketSupervisor) {
    notifications.push({
      id: `notif-${uuidv4().slice(0, 8)}`,
      userId: ticketSupervisor.id,
      type: 'task_assigned',
      title: '新退票申请待处理',
      content: `${order.groupName}有退票申请需要处理`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: refundTask.id
    });
  }
  
  return refundTask;
};

export const processRefund = (taskId, approved, remark, userId) => {
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    throw new Error('任务不存在');
  }
  
  const task = tasks[taskIndex];
  
  if (task.type !== TASK_TYPE.REFUND_REQUEST) {
    throw new Error('不是退票任务');
  }
  
  const order = orders.find(o => o.id === task.orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (approved) {
    const newPaidAmount = order.paidAmount - (task.refundAmount || 0);
    order.paidAmount = Math.max(0, newPaidAmount);
    
    if (newPaidAmount <= 0) {
      order.status = ORDER_STATUS.REFUNDED;
    } else {
      order.status = ORDER_STATUS.PARTIAL_REFUND;
    }
    order.updatedAt = new Date().toISOString();
    
    tasks[taskIndex].status = TASK_STATUS.APPROVED;
  } else {
    tasks[taskIndex].status = TASK_STATUS.REJECTED;
  }
  
  tasks[taskIndex].history.push({
    action: approved ? 'refund_approved' : 'refund_rejected',
    userId,
    timestamp: new Date().toISOString(),
    remark
  });
  tasks[taskIndex].updatedAt = new Date().toISOString();
  
  return { task: tasks[taskIndex], order };
};

export const processSettlement = (orderId, userId) => {
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  const settlementTask = {
    id: `task-${uuidv4().slice(0, 8)}`,
    chainId: order.chainId,
    performanceId: order.performanceId,
    type: TASK_TYPE.SETTLEMENT,
    title: `${order.groupName}费用结算`,
    description: '团单费用结算',
    orderId: order.id,
    status: TASK_STATUS.IN_PROGRESS,
    priority: 'medium',
    assigneeRole: ROLES.TICKET_SUPERVISOR,
    assignee: userId,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
      { action: 'settlement_started', userId, timestamp: new Date().toISOString(), remark: '启动结算流程' }
    ],
    settlementAmount: order.totalAmount
  };
  
  tasks.push(settlementTask);
  order.settlementStatus = 'processing';
  
  return settlementTask;
};
