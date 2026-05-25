import { v4 as uuidv4 } from 'uuid';
import { performances, orders, rehearsals, tasks, notifications, users } from '../data/database.js';
import { PERFORMANCE_STATUS, TASK_TYPE, TASK_STATUS, ROLES } from '../data/models.js';

export const getAllPerformances = (filters = {}) => {
  let result = [...performances];
  
  if (filters.status) {
    result = result.filter(p => p.status === filters.status);
  }
  if (filters.venue) {
    result = result.filter(p => p.venue === filters.venue);
  }
  if (filters.type) {
    result = result.filter(p => p.type === filters.type);
  }
  
  return result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};

export const getPerformanceById = (id) => {
  return performances.find(p => p.id === id);
};

export const getPerformanceChain = (chainId, userRole = null) => {
  const perf = performances.find(p => p.chainId === chainId);
  if (!perf) {
    return { performance: null, orders: [], rehearsals: [], tasks: [] };
  }
  
  const relatedOrders = orders.filter(o => o.chainId === chainId);
  const relatedRehearsals = rehearsals.filter(r => r.chainId === chainId);
  const relatedTasks = tasks.filter(t => t.chainId === chainId);
  
  if (!userRole || userRole === 'theater_manager') {
    return {
      performance: perf,
      orders: relatedOrders,
      rehearsals: relatedRehearsals,
      tasks: relatedTasks
    };
  }
  
  const result = {
    performance: perf,
    orders: [],
    rehearsals: [],
    tasks: []
  };
  
  if (userRole === 'ticket_supervisor') {
    result.orders = relatedOrders;
    result.tasks = relatedTasks.filter(t => 
      t.assigneeRole === 'ticket_supervisor' || 
      t.type === 'refund_request' || 
      t.type === 'ticket_group' ||
      t.type === 'settlement'
    );
  }
  
  if (userRole === 'backend_coordinator') {
    result.rehearsals = relatedRehearsals;
    result.tasks = relatedTasks.filter(t => 
      t.assigneeRole === 'backend_coordinator' || 
      t.type === 'rehearsal_arrangement' ||
      t.type === 'issue_report'
    );
  }
  
  return result;
};

export const createPerformance = (data, userId) => {
  const newPerformance = {
    id: `perf-${uuidv4().slice(0, 8)}`,
    ...data,
    chainId: `chain-${uuidv4().slice(0, 8)}`,
    status: PERFORMANCE_STATUS.DRAFT,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  
  performances.push(newPerformance);
  
  const approvalTask = {
    id: `task-${uuidv4().slice(0, 8)}`,
    chainId: newPerformance.chainId,
    performanceId: newPerformance.id,
    type: TASK_TYPE.SCHEDULE_APPROVAL,
    title: `${newPerformance.title}排期审批`,
    description: '新演出排期需要经理审批',
    status: TASK_STATUS.PENDING,
    priority: 'medium',
    assigneeRole: ROLES.THEATER_MANAGER,
    assignee: null,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
      { action: 'created', userId, timestamp: new Date().toISOString(), remark: '提交排期审批' }
    ]
  };
  
  tasks.push(approvalTask);
  
  const manager = users.find(u => u.role === ROLES.THEATER_MANAGER);
  if (manager) {
    notifications.push({
      id: `notif-${uuidv4().slice(0, 8)}`,
      userId: manager.id,
      type: 'approval',
      title: '新排期待审批',
      content: `${newPerformance.title}排期需要审批`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: approvalTask.id
    });
  }
  
  return newPerformance;
};

export const updatePerformance = (id, data, userId) => {
  const index = performances.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('演出不存在');
  }
  
  const oldPerformance = performances[index];
  
  const hasScheduleChange = 
    data.startTime !== oldPerformance.startTime ||
    data.endTime !== oldPerformance.endTime ||
    data.venue !== oldPerformance.venue;
  
  const changeReason = data.changeReason || '排期调整';
  delete data.changeReason;
  
  performances[index] = {
    ...oldPerformance,
    ...data,
    updatedAt: new Date().toISOString(),
    version: oldPerformance.version + 1
  };
  
  if (hasScheduleChange && oldPerformance.status !== PERFORMANCE_STATUS.DRAFT) {
    const changeNote = `演出${data.venue ? `场地变更为${data.venue}` : ''}${data.startTime ? `时间变更为${new Date(data.startTime).toLocaleString()}` : ''}`;
    const historyRemark = `${changeNote}，原因：${changeReason}`;
    
    const ticketTask = {
      id: `task-${uuidv4().slice(0, 8)}`,
      chainId: oldPerformance.chainId,
      performanceId: id,
      type: TASK_TYPE.SCHEDULE_CHANGE,
      title: `${oldPerformance.title}排期变更-票务确认`,
      description: `${changeNote}，请票务主管确认并通知相关团单。变更原因：${changeReason}`,
      status: TASK_STATUS.PENDING,
      priority: 'high',
      assigneeRole: ROLES.TICKET_SUPERVISOR,
      assignee: null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      history: [
        { action: 'schedule_changed', userId, timestamp: new Date().toISOString(), remark: historyRemark }
      ],
      oldSchedule: {
        startTime: oldPerformance.startTime,
        venue: oldPerformance.venue
      },
      newSchedule: {
        startTime: data.startTime || oldPerformance.startTime,
        venue: data.venue || oldPerformance.venue
      },
      changeReason
    };
    tasks.push(ticketTask);
    
    const backendTask = {
      id: `task-${uuidv4().slice(0, 8)}`,
      chainId: oldPerformance.chainId,
      performanceId: id,
      type: TASK_TYPE.SCHEDULE_CHANGE,
      title: `${oldPerformance.title}排期变更-联排调整`,
      description: `${changeNote}，请后台统筹调整联排时间和场地。变更原因：${changeReason}`,
      status: TASK_STATUS.PENDING,
      priority: 'high',
      assigneeRole: ROLES.BACKEND_COORDINATOR,
      assignee: null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      history: [
        { action: 'schedule_changed', userId, timestamp: new Date().toISOString(), remark: historyRemark }
      ],
      oldSchedule: {
        startTime: oldPerformance.startTime,
        venue: oldPerformance.venue
      },
      newSchedule: {
        startTime: data.startTime || oldPerformance.startTime,
        venue: data.venue || oldPerformance.venue
      },
      changeReason
    };
    tasks.push(backendTask);
    
    const ticketSupervisor = users.find(u => u.role === ROLES.TICKET_SUPERVISOR);
    const backendCoordinator = users.find(u => u.role === ROLES.BACKEND_COORDINATOR);
    
    if (ticketSupervisor) {
      notifications.push({
        id: `notif-${uuidv4().slice(0, 8)}`,
        userId: ticketSupervisor.id,
        type: 'schedule_change',
        title: '演出排期变更通知',
        content: `${oldPerformance.title}排期已变更（${changeNote}），原因：${changeReason}，请处理`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: ticketTask.id
      });
    }
    
    if (backendCoordinator) {
      notifications.push({
        id: `notif-${uuidv4().slice(0, 8)}`,
        userId: backendCoordinator.id,
        type: 'schedule_change',
        title: '演出排期变更通知',
        content: `${oldPerformance.title}排期已变更（${changeNote}），原因：${changeReason}，请调整联排`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: backendTask.id
      });
    }
  }
  
  return performances[index];
};

export const updatePerformanceStatus = (id, status, userId) => {
  const index = performances.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('演出不存在');
  }
  
  performances[index].status = status;
  performances[index].updatedAt = new Date().toISOString();
  
  return performances[index];
};

export const deletePerformance = (id) => {
  const index = performances.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error('演出不存在');
  }
  
  const deleted = performances.splice(index, 1);
  return deleted[0];
};
