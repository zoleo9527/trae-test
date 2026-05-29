import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { TodoCreateData, TodoType, Role, TODO_TYPE, ROLE } from '../types';
import { TodoItem } from '@prisma/client';

export class TodoService {
  async createTodo(data: TodoCreateData): Promise<TodoItem> {
    const todo = await prisma.todoItem.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        assigneeId: data.assigneeId,
        creatorId: data.creatorId,
        dueDate: data.dueDate,
        priority: data.priority || 1,
      },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    logger.info(`待办事项已创建: ${data.title}，指派给 ${todo.assignee.name}`);
    return todo;
  }

  async getMyTodos(userId: string, options?: {
    isCompleted?: boolean;
    type?: TodoType;
    page?: number;
    pageSize?: number;
  }) {
    const { isCompleted, type, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      assigneeId: userId,
    };

    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted;
    }

    if (type) {
      where.type = type;
    }

    const [todos, total] = await Promise.all([
      prisma.todoItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          creator: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.todoItem.count({ where }),
    ]);

    return {
      items: todos,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async completeTodo(todoId: string, userId: string): Promise<TodoItem> {
    const todo = await prisma.todoItem.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error('待办事项不存在');
    }

    if (todo.assigneeId !== userId) {
      throw new Error('只能完成自己的待办事项');
    }

    const completedTodo = await prisma.todoItem.update({
      where: { id: todoId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    logger.info(`待办事项已完成: ${todo.title}`);
    return completedTodo;
  }

  async getTodoStats(userId: string) {
    const [pending, completed, highPriority] = await Promise.all([
      prisma.todoItem.count({
        where: { assigneeId: userId, isCompleted: false },
      }),
      prisma.todoItem.count({
        where: { assigneeId: userId, isCompleted: true },
      }),
      prisma.todoItem.count({
        where: { assigneeId: userId, isCompleted: false, priority: { gte: 2 } },
      }),
    ]);

    return {
      pending,
      completed,
      highPriority,
      total: pending + completed,
    };
  }

  async findUserByRole(role: Role) {
    return prisma.user.findFirst({
      where: { role, isActive: true },
    });
  }

  async findAllUsersByRole(role: Role) {
    return prisma.user.findMany({
      where: { role, isActive: true },
    });
  }
}

export default new TodoService();
