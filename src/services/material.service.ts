import { MaterialStatus, UserRole } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import { v4 as uuidv4 } from 'uuid';

export const materialService = {
  async create(data: {
    projectId: string;
    name: string;
    category: string;
    brand: string;
    model: string;
    quantity: number;
    unit: string;
    estimatedPrice?: number;
    expectedArrivalDate?: Date;
  }, creatorId: string, ipAddress?: string) {
    const idempotencyKey = uuidv4();

    const material = await prisma.material.create({
      data: {
        ...data,
        creatorId,
        handlerId: creatorId,
        idempotencyKey,
        estimatedPrice: data.estimatedPrice ? data.estimatedPrice.toString() : undefined
      },
      include: {
        project: true,
        creator: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } }
      }
    });

    await auditService.log(creatorId, 'CREATE_MATERIAL', material.id, data, ipAddress);

    return material;
  },

  async list(filters: {
    projectId?: string;
    status?: MaterialStatus;
    category?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  }) {
    const { projectId, status, category, keyword, page, pageSize } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { brand: { contains: keyword } },
        { model: { contains: keyword } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, role: true } },
          handler: { select: { id: true, name: true, role: true } },
          _count: { select: { inspections: true, evidences: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);

    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), data };
  },

  async getDetail(id: string) {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        project: true,
        creator: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } },
        inspections: {
          include: {
            inspector: { select: { id: true, name: true, role: true } },
            evidences: true,
            comments: { include: { author: { select: { id: true, name: true, role: true } } } }
          },
          orderBy: { createdAt: 'desc' }
        },
        evidences: { orderBy: { createdAt: 'desc' } },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        changeLogs: {
          include: { material: false },
          orderBy: { changedAt: 'desc' }
        }
      }
    });

    if (!material) {
      throw new AppError('主材不存在', 'MATERIAL_NOT_FOUND', 404);
    }

    return material;
  },

  async updateStatus(id: string, status: MaterialStatus, userId: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new AppError('主材不存在', 'MATERIAL_NOT_FOUND', 404);
    }

    if (!this.canTransitionStatus(material.status, status)) {
      throw new AppError(`无法从 ${material.status} 转换到 ${status}`, 'INVALID_STATUS_TRANSITION', 400);
    }

    const updated = await prisma.material.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
        actualArrivalDate: status === MaterialStatus.ARRIVED ? new Date() : undefined,
        installationStartDate: status === MaterialStatus.INSTALLING ? new Date() : undefined,
        installationEndDate: status === MaterialStatus.INSTALLATION_COMPLETED ? new Date() : undefined
      },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, role: true } },
        handler: { select: { id: true, name: true, role: true } }
      }
    });

    await prisma.changeLog.create({
      data: {
        materialId: id,
        fieldName: 'status',
        oldValue: material.status,
        newValue: status,
        changedBy: userId,
        changeReason: '状态流转'
      }
    });

    await auditService.log(userId, 'STATUS_CHANGE', id, { oldStatus: material.status, newStatus: status }, ipAddress);

    return updated;
  },

  canTransitionStatus(current: MaterialStatus, next: MaterialStatus): boolean {
    const transitions: Record<MaterialStatus, MaterialStatus[]> = {
      [MaterialStatus.PENDING_ARRIVAL]: [MaterialStatus.ARRIVED, MaterialStatus.CANCELLED],
      [MaterialStatus.ARRIVED]: [MaterialStatus.INSPECTION_PENDING, MaterialStatus.CANCELLED],
      [MaterialStatus.INSPECTION_PENDING]: [MaterialStatus.INSPECTION_PASSED, MaterialStatus.INSPECTION_FAILED],
      [MaterialStatus.INSPECTION_PASSED]: [MaterialStatus.INSTALLATION_PENDING],
      [MaterialStatus.INSPECTION_FAILED]: [MaterialStatus.INSPECTION_PENDING, MaterialStatus.CANCELLED],
      [MaterialStatus.INSTALLATION_PENDING]: [MaterialStatus.INSTALLING, MaterialStatus.CANCELLED],
      [MaterialStatus.INSTALLING]: [MaterialStatus.INSTALLATION_COMPLETED],
      [MaterialStatus.INSTALLATION_COMPLETED]: [MaterialStatus.ACCEPTED, MaterialStatus.REJECTED],
      [MaterialStatus.ACCEPTED]: [],
      [MaterialStatus.REJECTED]: [MaterialStatus.INSTALLING, MaterialStatus.CANCELLED],
      [MaterialStatus.CANCELLED]: []
    };
    return transitions[current]?.includes(next) || false;
  },

  async assignHandler(id: string, handlerId: string, assigneeId: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new AppError('主材不存在', 'MATERIAL_NOT_FOUND', 404);
    }

    const handler = await prisma.user.findUnique({ where: { id: handlerId } });
    if (!handler) {
      throw new AppError('处理人不存在', 'USER_NOT_FOUND', 404);
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { handlerId, version: { increment: 1 } }
    });

    await prisma.changeLog.create({
      data: {
        materialId: id,
        fieldName: 'handlerId',
        oldValue: material.handlerId,
        newValue: handlerId,
        changedBy: assigneeId,
        changeReason: '分配处理人'
      }
    });

    await auditService.log(assigneeId, 'ASSIGN_HANDLER', id, { handlerId, handlerName: handler.name }, ipAddress);

    return updated;
  },

  async export(filters: { projectId?: string; status?: MaterialStatus }) {
    const where: any = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;

    return prisma.material.findMany({
      where,
      include: {
        project: true,
        creator: { select: { name: true } },
        handler: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};
