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

export const getPerformanceChain = (chainId) => {
  const perf = performances.find(p => p.chainId === chainId);
  const relatedOrders = orders.filter(o => o.chainId === chainId);
  const relatedRehearsals = rehearsals.filter(r => r.chainId === chainId);
  const relatedTasks = tasks.filter(t => t.chainId === chainId);
  
  return {
    performance: perf,
    orders: relatedOrders,
    rehearsals: relatedRehearsals,
    tasks: relatedTasks
  };
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
  
  performances[index] = {
    ...oldPerformance,
    ...data,
    updatedAt: new Date().toISOString(),
    version: oldPerformance.version + 1
  };
  
  if (hasScheduleChange && oldPerformance.status !== PERFORMANCE_STATUS.DRAFT) {
    const changeTask = {
      id: `task-${uuidv4().slice(0, 8)}`,
      chainId: oldPerformance.chainId,
      performanceId: id,
      type: TASK_TYPE.SCHEDULE_CHANGE,
      title: `${oldPerformance.title}排期变更通知`,
      description: `演出时间或场地有变更，请相关人员注意`,
      status: TASK_STATUS.IN_PROGRESS,
      priority: 'high',
      assigneeRole: ROLES.THEATER_MANAGER,
      assignee: userId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      history: [
        { action: 'schedule_changed', userId, timestamp: new Date().toISOString(), remark: '排期已变更' }
      ]
    };
    
    tasks.push(changeTask);
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
