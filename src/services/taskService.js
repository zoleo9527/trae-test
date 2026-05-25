import { v4 as uuidv4 } from 'uuid';
import { tasks, notifications, users } from '../data/database.js';
import { TASK_STATUS } from '../data/models.js';

export const getMyTasks = (userId, userRole, filters = {}) => {
  let result = tasks.filter(t => {
    const matchRole = t.assigneeRole === userRole;
    const matchAssignee = !t.assignee || t.assignee === userId;
    return matchRole && matchAssignee;
  });
  
  if (filters.status) {
    result = result.filter(t => t.status === filters.status);
  }
  if (filters.priority) {
    result = result.filter(t => t.priority === filters.priority);
  }
  if (filters.type) {
    result = result.filter(t => t.type === filters.type);
  }
  if (filters.active === 'true') {
    result = result.filter(t => 
      t.status === TASK_STATUS.PENDING || 
      t.status === TASK_STATUS.IN_PROGRESS
    );
  }
  
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return result.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
};

export const getAllTasks = (filters = {}) => {
  let result = [...tasks];
  
  if (filters.status) {
    result = result.filter(t => t.status === filters.status);
  }
  if (filters.chainId) {
    result = result.filter(t => t.chainId === filters.chainId);
  }
  if (filters.performanceId) {
    result = result.filter(t => t.performanceId === filters.performanceId);
  }
  
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getTaskById = (id) => {
  return tasks.find(t => t.id === id);
};

export const checkTaskPermission = (taskId, userId, userRole) => {
  const task = getTaskById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  const matchRole = task.assigneeRole === userRole;
  const matchAssignee = !task.assignee || task.assignee === userId;
  if (!matchRole || !matchAssignee) {
    throw new Error('无权操作此任务');
  }
  return task;
};

export const updateTaskStatus = (id, status, remark, userId) => {
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error('任务不存在');
  }
  
  tasks[index].status = status;
  tasks[index].updatedAt = new Date().toISOString();
  tasks[index].assignee = userId;
  
  tasks[index].history.push({
    action: `status_${status}`,
    userId,
    timestamp: new Date().toISOString(),
    remark
  });
  
  return tasks[index];
};

export const assignTask = (id, userId, assigneeId) => {
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error('任务不存在');
  }
  
  tasks[index].assignee = assigneeId;
  tasks[index].status = TASK_STATUS.IN_PROGRESS;
  tasks[index].updatedAt = new Date().toISOString();
  
  tasks[index].history.push({
    action: 'assigned',
    userId,
    timestamp: new Date().toISOString(),
    remark: `分配给用户 ${assigneeId}`
  });
  
  const assignee = users.find(u => u.id === assigneeId);
  if (assignee) {
    notifications.push({
      id: `notif-${uuidv4().slice(0, 8)}`,
      userId: assigneeId,
      type: 'task_assigned',
      title: '新任务分配',
      content: `您有新任务：${tasks[index].title}`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: id
    });
  }
  
  return tasks[index];
};

export const getOverdueTasks = (userId, userRole) => {
  const now = new Date();
  return getMyTasks(userId, userRole).filter(t => 
    t.status !== TASK_STATUS.COMPLETED && 
    t.status !== TASK_STATUS.APPROVED &&
    t.status !== TASK_STATUS.REJECTED &&
    new Date(t.dueDate) < now
  );
};

export const approveTask = (id, remark, userId) => {
  return updateTaskStatus(id, TASK_STATUS.APPROVED, remark, userId);
};

export const rejectTask = (id, remark, userId) => {
  return updateTaskStatus(id, TASK_STATUS.REJECTED, remark, userId);
};

export const completeTask = (id, remark, userId) => {
  return updateTaskStatus(id, TASK_STATUS.COMPLETED, remark, userId);
};
