import { v4 as uuidv4 } from 'uuid';
import { rehearsals, performances, tasks, notifications, users } from '../data/database.js';
import { REHEARSAL_STATUS, TASK_TYPE, TASK_STATUS, ROLES } from '../data/models.js';

export const getAllRehearsals = (filters = {}) => {
  let result = [...rehearsals];
  
  if (filters.status) {
    result = result.filter(r => r.status === filters.status);
  }
  if (filters.performanceId) {
    result = result.filter(r => r.performanceId === filters.performanceId);
  }
  if (filters.chainId) {
    result = result.filter(r => r.chainId === filters.chainId);
  }
  if (filters.coordinator) {
    result = result.filter(r => r.coordinator === filters.coordinator);
  }
  
  return result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};

export const getRehearsalById = (id) => {
  return rehearsals.find(r => r.id === id);
};

export const createRehearsal = (data, userId) => {
  const performance = performances.find(p => p.id === data.performanceId);
  
  if (!performance) {
    throw new Error('演出不存在');
  }
  
  const newRehearsal = {
    id: `rehearsal-${uuidv4().slice(0, 8)}`,
    ...data,
    chainId: performance.chainId,
    status: REHEARSAL_STATUS.SCHEDULED,
    coordinator: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    issuesReported: []
  };
  
  rehearsals.push(newRehearsal);
  
  return newRehearsal;
};

export const updateRehearsal = (id, data, userId) => {
  const index = rehearsals.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('排练不存在');
  }
  
  rehearsals[index] = {
    ...rehearsals[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return rehearsals[index];
};

export const updateRehearsalStatus = (id, status, userId) => {
  const index = rehearsals.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error('排练不存在');
  }
  
  rehearsals[index].status = status;
  rehearsals[index].updatedAt = new Date().toISOString();
  
  return rehearsals[index];
};

export const reportIssue = (rehearsalId, issueContent, userId) => {
  const rehearsal = rehearsals.find(r => r.id === rehearsalId);
  
  if (!rehearsal) {
    throw new Error('排练不存在');
  }
  
  const newIssue = {
    id: `issue-${uuidv4().slice(0, 8)}`,
    content: issueContent,
    status: 'pending',
    reportedAt: new Date().toISOString(),
    reportedBy: userId
  };
  
  rehearsal.issuesReported.push(newIssue);
  rehearsal.updatedAt = new Date().toISOString();
  
  const coordinator = users.find(u => u.id === rehearsal.coordinator);
  if (coordinator && coordinator.id !== userId) {
    notifications.push({
      id: `notif-${uuidv4().slice(0, 8)}`,
      userId: coordinator.id,
      type: 'issue',
      title: '联排现场发现问题',
      content: `${rehearsal.title}发现问题：${issueContent.slice(0, 30)}...`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: rehearsalId
    });
  }
  
  return newIssue;
};

export const resolveIssue = (rehearsalId, issueId, userId) => {
  const rehearsal = rehearsals.find(r => r.id === rehearsalId);
  
  if (!rehearsal) {
    throw new Error('排练不存在');
  }
  
  const issue = rehearsal.issuesReported.find(i => i.id === issueId);
  
  if (!issue) {
    throw new Error('问题不存在');
  }
  
  issue.status = 'resolved';
  issue.resolvedAt = new Date().toISOString();
  issue.resolvedBy = userId;
  rehearsal.updatedAt = new Date().toISOString();
  
  return issue;
};

export const requestRehearsalArrangement = (performanceId, description, userId) => {
  const performance = performances.find(p => p.id === performanceId);
  
  if (!performance) {
    throw new Error('演出不存在');
  }
  
  const arrangementTask = {
    id: `task-${uuidv4().slice(0, 8)}`,
    chainId: performance.chainId,
    performanceId: performance.id,
    type: TASK_TYPE.REHEARSAL_ARRANGEMENT,
    title: `${performance.title}排练安排`,
    description,
    status: TASK_STATUS.PENDING,
    priority: 'high',
    assigneeRole: ROLES.BACKEND_COORDINATOR,
    assignee: null,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    history: [
      { action: 'arrangement_requested', userId, timestamp: new Date().toISOString(), remark: description }
    ]
  };
  
  tasks.push(arrangementTask);
  
  const backendCoordinator = users.find(u => u.role === ROLES.BACKEND_COORDINATOR);
  if (backendCoordinator) {
    notifications.push({
      id: `notif-${uuidv4().slice(0, 8)}`,
      userId: backendCoordinator.id,
      type: 'task_assigned',
      title: '新排练安排任务',
      content: `${performance.title}需要安排排练`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: arrangementTask.id
    });
  }
  
  return arrangementTask;
};
