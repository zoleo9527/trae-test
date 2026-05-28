import prisma from '../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import auditService from './auditService.js';

const taskService = {
  async createTask(data, userId, ipAddress) {
    const { type, title, description, berthingPlanId, documentId, priority, deadline, assignedToId } = data;

    if (!berthingPlanId) {
      throw new ValidationError('任务必须关联靠泊计划');
    }

    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('关联的靠泊计划不存在');
    }

    const chainId = berthingPlan.chainId;
    const chainSequence = 1;

    const task = await prisma.task.create({
      data: {
        type,
        title,
        description,
        berthingPlanId,
        documentId,
        priority: priority || 3,
        deadline: deadline ? new Date(deadline) : null,
        assignedToId,
        chainId,
        chainSequence,
        createdById: userId,
      },
      include: {
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true, role: true } },
        berthingPlan: berthingPlanId ? { select: { planNumber: true } } : false,
        document: documentId ? { select: { title: true } } : false,
      },
    });

    await auditService.log('CREATE', 'Task', task.id, userId, {
      chainId: task.chainId,
      newValues: task,
      ipAddress,
      remarks: `创建任务: ${title}`,
    });

    return task;
  },

  async createTaskChain(berthingPlanId, userId) {
    const berthingPlan = await prisma.berthingPlan.findUnique({
      where: { id: berthingPlanId },
      select: { id: true, chainId: true },
    });

    if (!berthingPlan) {
      throw new ValidationError('靠泊计划不存在');
    }

    const chainId = berthingPlan.chainId;

    const tasks = [
      {
        type: 'BERTHING_PLAN',
        title: '提交靠泊申请',
        description: '完成靠泊计划信息填写并提交审批',
        priority: 1,
        isBlocking: true,
      },
      {
        type: 'DOCUMENT_PREPARE',
        title: '准备船员名单',
        description: '准备并提交船员名单(CREW_MANIFEST)',
        priority: 2,
        isBlocking: true,
      },
      {
        type: 'DOCUMENT_PREPARE',
        title: '准备货物申报',
        description: '准备并提交货物申报单(CARGO_MANIFEST)',
        priority: 2,
        isBlocking: true,
      },
      {
        type: 'DOCUMENT_SUBMIT',
        title: '提交港口清关文件',
        description: '向港务局提交所有清关文件',
        priority: 3,
        isBlocking: false,
      },
      {
        type: 'CREW_CHANGE',
        title: '安排船员换班',
        description: '协调船员换班事宜',
        priority: 3,
        isBlocking: false,
      },
      {
        type: 'SUPPLY_ARRANGE',
        title: '安排船舶补给',
        description: '联系供应商安排船舶物资补给',
        priority: 4,
        isBlocking: false,
      },
      {
        type: 'FEE_SETTLE',
        title: '结算费用',
        description: '确认并结算所有港口相关费用',
        priority: 2,
        isBlocking: true,
      },
    ];

    const createdTasks = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = await prisma.task.create({
        data: {
          ...tasks[i],
          berthingPlanId,
          chainId,
          chainSequence: i + 1,
          createdById: userId,
        },
      });
      createdTasks.push(task);
    }

    await auditService.log('CREATE', 'TaskChain', chainId, userId, {
      chainId,
      newValues: { taskCount: tasks.length },
      remarks: `为靠泊计划创建任务链`,
    });

    return createdTasks;
  },

  async getTask(id) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, role: true } },
        assignedTo: { select: { name: true, role: true } },
        berthingPlan: { select: { planNumber: true, vessel: { select: { name: true } } } },
        document: { select: { title: true, type: true } },
        comments: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('任务不存在');
    }

    return task;
  },

  async getTasks(filters = {}, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'priority', sortOrder = 'asc' } = options;
    const { status, type, assignedToId, createdById, berthingPlanId, isBlocking } = filters;

    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById) where.createdById = createdById;
    if (berthingPlanId) where.berthingPlanId = berthingPlanId;
    if (isBlocking !== undefined) where.isBlocking = isBlocking;

    const orderBy = {};
    if (sortBy === 'priority') {
      orderBy.priority = 'asc';
      orderBy.deadline = 'asc';
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          createdBy: { select: { name: true } },
          assignedTo: { select: { name: true } },
          berthingPlan: { select: { planNumber: true } },
          document: { select: { title: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async updateTask(id, data, userId, ipAddress) {
    const oldTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!oldTask) {
      throw new NotFoundError('任务不存在');
    }

    if (oldTask.status === 'COMPLETED' || oldTask.status === 'CANCELLED') {
      throw new ConflictError(`${oldTask.status === 'COMPLETED' ? '已完成' : '已取消'}的任务无法修改`);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : oldTask.deadline,
      },
      include: {
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    });

    const changes = Object.keys(data).filter(key => oldTask[key] !== data[key]);
    if (changes.length > 0) {
      await auditService.log('UPDATE', 'Task', id, userId, {
        chainId: oldTask.chainId,
        oldValues: oldTask,
        newValues: updatedTask,
        changes,
        ipAddress,
        remarks: '更新任务信息',
      });
    }

    return updatedTask;
  },

  async updateTaskStatus(id, status, userId, ipAddress, blockedReason = '') {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundError('任务不存在');
    }

    const validTransitions = {
      PENDING: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'BLOCKED', 'PENDING'],
      BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      throw new ConflictError(`无法从 ${task.status} 状态转换到 ${status}`);
    }

    if (task.isBlocking && task.chainSequence > 1) {
      const prevTask = await prisma.task.findFirst({
        where: {
          chainId: task.chainId,
          chainSequence: task.chainSequence - 1,
        },
      });

      if (prevTask && prevTask.status !== 'COMPLETED' && status === 'IN_PROGRESS') {
        throw new ConflictError('前置任务未完成，无法开始此任务');
      }
    }

    const updateData = { status };
    if (status === 'COMPLETED') {
      updateData.completedDate = new Date();
    } else if (status === 'BLOCKED') {
      updateData.blockedReason = blockedReason;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        berthingPlan: { select: { planNumber: true } },
      },
    });

    await auditService.log('STATUS_CHANGE', 'Task', id, userId, {
      chainId: task.chainId,
      oldValues: { status: task.status },
      newValues: { status },
      ipAddress,
      remarks: blockedReason || `任务状态变更: ${task.status} → ${status}`,
    });

    return updatedTask;
  },

  async getMyTasks(userId, filters = {}) {
    return this.getTasks({ ...filters, assignedToId: userId });
  },

  async getTaskStats(userId) {
    const [allTasks, byStatus] = await Promise.all([
      prisma.task.count({
        where: { assignedToId: userId },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { assignedToId: userId },
        _count: true,
      }),
    ]);

    const statusMap = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count; });

    return {
      total: allTasks,
      byStatus: statusMap,
    };
  },

  async getChainProgress(chainId) {
    const tasks = await prisma.task.findMany({
      where: { chainId },
      orderBy: { chainSequence: 'asc' },
    });

    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;

    return {
      total: tasks.length,
      completed,
      blocked,
      inProgress,
      progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      tasks,
    };
  },
};

export default taskService;
