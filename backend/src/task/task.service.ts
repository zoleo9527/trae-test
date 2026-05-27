import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskType, UserRole, RefundStatus } from '@prisma/client';

interface CompleteTaskData {
  resultNote: string;
  inspectionResult?: string;
  inspectionPhoto?: string;
}

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async getTaskBoard() {
    const tasks = await this.prisma.task.findMany({
      include: {
        station: true,
        assignee: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      unassigned: tasks.filter((t) => t.status === TaskStatus.UNASSIGNED),
      pending: tasks.filter((t) => t.status === TaskStatus.PENDING),
      inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
      completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED),
    };
  }

  async getTasksByRole(role: UserRole, assigneeId?: string) {
    let taskTypes: TaskType[] = [];
    let where: any = {};

    switch (role) {
      case UserRole.INSPECTOR:
        taskTypes = [TaskType.STATION_INSPECTION, TaskType.REFUND_REVIEW, TaskType.SUPPLY_REPLENISHMENT];
        where = {
          type: { in: taskTypes },
          status: { in: [TaskStatus.UNASSIGNED, TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        };
        if (assigneeId) {
          where.OR = [
            { assigneeId: null },
            { assigneeId }
          ];
        }
        break;
      case UserRole.CUSTOMER_SERVICE:
        taskTypes = [TaskType.VERIFICATION_DISPUTE, TaskType.REFUND_REVIEW];
        where = {
          type: { in: taskTypes },
          status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        };
        break;
      case UserRole.OPERATION_MANAGER:
        where = {
          status: { in: [TaskStatus.UNASSIGNED, TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        };
        break;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        station: true,
        assignee: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async assignTask(taskId: string, assigneeId: string) {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId,
        status: TaskStatus.PENDING,
      },
      include: {
        assignee: true,
        station: true,
      },
    });

    return task;
  }

  async startTask(taskId: string, assigneeId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId,
        status: TaskStatus.IN_PROGRESS,
      },
      include: {
        assignee: true,
        station: true,
      },
    });
  }

  async completeTask(taskId: string, data: CompleteTaskData) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
          resultNote: data.resultNote,
        },
        include: {
          station: true,
          assignee: true,
        },
      });

      if (task.type === TaskType.REFUND_REVIEW && task.relatedId) {
        const refund = await tx.refundRequest.findUnique({
          where: { id: task.relatedId },
        });

        if (refund && refund.status === RefundStatus.INSPECTION_REQUIRED) {
          const inspectionResult = data.inspectionResult || data.resultNote;
          
          await tx.refundRequest.update({
            where: { id: task.relatedId },
            data: {
              status: RefundStatus.CS_REVIEWING,
              inspectorId: task.assigneeId,
              inspectionResult,
              inspectionPhoto: data.inspectionPhoto,
              inspectionTime: new Date(),
            },
          });

          await tx.refundFlowLog.create({
            data: {
              refundId: task.relatedId,
              fromStatus: RefundStatus.INSPECTION_REQUIRED,
              toStatus: RefundStatus.CS_REVIEWING,
              operatorId: task.assigneeId || 'unknown',
              operatorName: task.assignee?.name || '未知巡检员',
              operatorRole: UserRole.INSPECTOR,
              remark: inspectionResult,
            },
          });
        }
      }

      if (task.type === TaskType.STATION_INSPECTION) {
        const openIssues = await tx.deviceReport.count({
          where: { stationId: task.stationId, resolved: false },
        });

        const lowSupplies = await tx.supplyRecord.count({
          where: { stationId: task.stationId, currentQty: { lte: tx.supplyRecord.fields.warningQty } },
        });

        if (openIssues === 0 && lowSupplies === 0) {
          await tx.station.update({
            where: { id: task.stationId },
            data: { status: 'NORMAL', warningLevel: 0 },
          });
        }
      }

      return task;
    });
  }

  async createReplenishmentTask(stationId: string, supplyType: string) {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });

    return this.prisma.task.create({
      data: {
        type: TaskType.SUPPLY_REPLENISHMENT,
        stationId,
        title: `耗材补货 - ${station.name}`,
        description: `需要补充: ${supplyType}`,
        status: TaskStatus.UNASSIGNED,
        priority: 2,
      },
      include: {
        station: true,
      },
    });
  }
}
