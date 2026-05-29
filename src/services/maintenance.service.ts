import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { createAuditLog } from '../middleware/audit.middleware';
import todoService from './todo.service';
import {
  MaintenanceType,
  DiseaseSeverity,
  AuditAction,
  TodoType,
  Role,
  MAINTENANCE_TYPE,
  DISEASE_SEVERITY,
  AUDIT_ACTION,
  TODO_TYPE,
  ROLE,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateMaintenanceRequest {
  idempotencyKey: string;
  plotId: string;
  batchId?: string;
  workerId: string;
  maintenanceDate: Date;
  type: MaintenanceType;
  durationMinutes: number;
  weather?: string;
  dosage?: string;
  notes?: string;
  needsReview?: boolean;
}

export interface CreateDiseaseReportRequest {
  idempotencyKey: string;
  plotId: string;
  batchId?: string;
  reporterId: string;
  discoveredDate: Date;
  symptoms: string;
  severity: DiseaseSeverity;
  affectedArea?: number;
  suspectedCause?: string;
  initialAction?: string;
  followUpDate?: Date;
}

export class MaintenanceService {
  async createMaintenance(data: CreateMaintenanceRequest) {
    const plot = await prisma.plot.findUnique({
      where: { id: data.plotId, isActive: true },
    });

    if (!plot) {
      throw new Error('地块不存在或已停用');
    }

    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        idempotencyKey: data.idempotencyKey || uuidv4(),
        plotId: data.plotId,
        batchId: data.batchId,
        workerId: data.workerId,
        maintenanceDate: data.maintenanceDate,
        type: data.type,
        durationMinutes: data.durationMinutes,
        weather: data.weather,
        dosage: data.dosage,
        notes: data.notes,
        needsReview: data.needsReview || false,
      },
      include: {
        plot: true,
        batch: { select: { id: true, species: true } },
        worker: { select: { id: true, name: true, role: true } },
      },
    });

    if (data.needsReview) {
      const managers = await todoService.findAllUsersByRole(ROLE.BASE_MANAGER);
      if (managers.length > 0) {
        await todoService.createTodo({
          type: TODO_TYPE.MAINTENANCE_REVIEW,
          title: `养护记录待审核: ${plot.plotNo}`,
          description: `养护类型: ${data.type}，备注: ${data.notes || '无'}`,
          referenceId: maintenance.id,
          referenceType: 'MaintenanceRecord',
          assigneeId: managers[0].id,
          creatorId: data.workerId,
          priority: 1,
        });
      }
    }

    await createAuditLog({
      userId: data.workerId,
      action: AUDIT_ACTION.CREATE,
      entityType: 'MaintenanceRecord',
      entityId: maintenance.id,
      newValue: maintenance,
      changeSummary: `创建养护记录，地块: ${plot.plotNo}，类型: ${data.type}`,
    });

    logger.info(`养护记录已创建: ${maintenance.id}`);
    return maintenance;
  }

  async reviewMaintenance(
    recordId: string,
    reviewerId: string,
    reviewNote: string,
    needsFollowUp: boolean = false
  ) {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error('养护记录不存在');
    }

    if (!record.needsReview) {
      throw new Error('该记录无需审核');
    }

    const updated = await prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        needsReview: false,
        reviewNote,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        plot: true,
        worker: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: reviewerId,
      action: AUDIT_ACTION.APPROVE,
      entityType: 'MaintenanceRecord',
      entityId: recordId,
      previousValue: { needsReview: true },
      newValue: { needsReview: false, reviewNote },
      changeSummary: `审核养护记录: ${reviewNote}`,
    });

    logger.info(`养护记录已审核: ${recordId}`);
    return updated;
  }

  async createDiseaseReport(data: CreateDiseaseReportRequest) {
    const plot = await prisma.plot.findUnique({
      where: { id: data.plotId, isActive: true },
    });

    if (!plot) {
      throw new Error('地块不存在或已停用');
    }

    const report = await prisma.$transaction(async (tx) => {
      const r = await tx.diseaseReport.create({
        data: {
          idempotencyKey: data.idempotencyKey || uuidv4(),
          plotId: data.plotId,
          batchId: data.batchId,
          reporterId: data.reporterId,
          discoveredDate: data.discoveredDate,
          symptoms: data.symptoms,
          severity: data.severity,
          affectedArea: data.affectedArea,
          suspectedCause: data.suspectedCause,
          initialAction: data.initialAction,
          followUpDate: data.followUpDate,
        },
        include: {
          plot: true,
          batch: { select: { id: true, species: true } },
          reporter: { select: { id: true, name: true, role: true } },
        },
      });

      const managers = await todoService.findAllUsersByRole(ROLE.BASE_MANAGER);
      if (managers.length > 0) {
        const priority =
          data.severity === DISEASE_SEVERITY.CRITICAL ||
          data.severity === DISEASE_SEVERITY.SEVERE
            ? 3
            : 2;

        await tx.todoItem.create({
          data: {
            type: TODO_TYPE.DISEASE_FOLLOWUP,
            title: `病害上报待处理: ${plot.plotNo}`,
            description: `严重程度: ${data.severity}，症状: ${data.symptoms}`,
            referenceId: r.id,
            referenceType: 'DiseaseReport',
            assigneeId: managers[0].id,
            creatorId: data.reporterId,
            priority,
            dueDate: data.followUpDate,
          },
        });
      }

      return r;
    });

    await createAuditLog({
      userId: data.reporterId,
      action: AUDIT_ACTION.CREATE,
      entityType: 'DiseaseReport',
      entityId: report.id,
      newValue: report,
      changeSummary: `病害上报，地块: ${plot.plotNo}，严重程度: ${data.severity}`,
    });

    logger.warn(`病害已上报: ${report.id}，严重程度: ${data.severity}`);
    return report;
  }

  async resolveDiseaseReport(
    reportId: string,
    resolverId: string,
    resolutionNote: string
  ) {
    const report = await prisma.diseaseReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('病害报告不存在');
    }

    if (report.isResolved) {
      throw new Error('该病害已处理');
    }

    const updated = await prisma.diseaseReport.update({
      where: { id: reportId },
      data: {
        isResolved: true,
        resolutionNote,
        resolvedAt: new Date(),
      },
      include: {
        plot: true,
        reporter: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: resolverId,
      action: AUDIT_ACTION.APPROVE,
      entityType: 'DiseaseReport',
      entityId: reportId,
      previousValue: { isResolved: false },
      newValue: { isResolved: true, resolutionNote },
      changeSummary: `病害已处理: ${resolutionNote}`,
    });

    logger.info(`病害已处理: ${reportId}`);
    return updated;
  }

  async getMaintenanceList(options?: {
    plotId?: string;
    workerId?: string;
    type?: MaintenanceType;
    needsReview?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { plotId, workerId, type, needsReview, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (plotId) where.plotId = plotId;
    if (workerId) where.workerId = workerId;
    if (type) where.type = type;
    if (needsReview !== undefined) where.needsReview = needsReview;

    const [items, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { maintenanceDate: 'desc' },
        include: {
          plot: { select: { id: true, plotNo: true, location: true } },
          batch: { select: { id: true, species: true } },
          worker: { select: { id: true, name: true } },
        },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getDiseaseReportList(options?: {
    plotId?: string;
    reporterId?: string;
    severity?: DiseaseSeverity;
    isResolved?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { plotId, reporterId, severity, isResolved, page = 1, pageSize = 20 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (plotId) where.plotId = plotId;
    if (reporterId) where.reporterId = reporterId;
    if (severity) where.severity = severity;
    if (isResolved !== undefined) where.isResolved = isResolved;

    const [items, total] = await Promise.all([
      prisma.diseaseReport.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          plot: { select: { id: true, plotNo: true, location: true } },
          batch: { select: { id: true, species: true } },
          reporter: { select: { id: true, name: true } },
        },
      }),
      prisma.diseaseReport.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getUnresolvedDiseases(userId: string, role: Role) {
    const where: Record<string, unknown> = {
      isResolved: false,
    };

    if (role === ROLE.MAINTENANCE_WORKER) {
      where.reporterId = userId;
    }

    return prisma.diseaseReport.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 10,
      include: {
        plot: { select: { id: true, plotNo: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
  }
}

export default new MaintenanceService();
