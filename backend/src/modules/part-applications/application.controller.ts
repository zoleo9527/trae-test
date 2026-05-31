import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { generateApplicationNo, generateLockNo } from '../../utils/orderNo';
import { parsePagination } from '../../utils/pagination';
import { success, successWithPagination } from '../../utils/response';
import { AppError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { config } from '../../config';
import {
  PartApplicationStatus,
  InventoryLockStatus,
  RepairOrderStatus,
  NoteType,
} from '../../types/enums';

const VALID_STATUS_TRANSITIONS: Record<PartApplicationStatus, PartApplicationStatus[]> = {
  [PartApplicationStatus.DRAFT]: [
    PartApplicationStatus.PENDING_APPROVAL,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.PENDING_APPROVAL]: [
    PartApplicationStatus.APPROVED,
    PartApplicationStatus.REJECTED,
    PartApplicationStatus.PARTIAL_APPROVED,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.REJECTED]: [
    PartApplicationStatus.PENDING_APPROVAL,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.PARTIAL_APPROVED]: [
    PartApplicationStatus.AWAITING_STOCK,
    PartApplicationStatus.PROCESSING,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.APPROVED]: [
    PartApplicationStatus.AWAITING_STOCK,
    PartApplicationStatus.PROCESSING,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.AWAITING_STOCK]: [
    PartApplicationStatus.PROCESSING,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.PROCESSING]: [
    PartApplicationStatus.COMPLETED,
    PartApplicationStatus.CANCELLED,
  ],
  [PartApplicationStatus.COMPLETED]: [],
  [PartApplicationStatus.CANCELLED]: [],
};

export async function createApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      repairOrderId,
      title,
      description,
      urgencyLevel,
      expectedPickupDate,
      items,
      note,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const repairOrder = await tx.repairOrder.findUnique({
        where: { id: repairOrderId },
        select: { id: true, orderNo: true, status: true },
      });

      if (!repairOrder) {
        throw new NotFoundError('寄修单不存在');
      }

      if (
        repairOrder.status !== RepairOrderStatus.QUOTATION_APPROVED &&
        repairOrder.status !== RepairOrderStatus.AWAITING_PARTS &&
        repairOrder.status !== RepairOrderStatus.IN_REPAIR
      ) {
        throw new ValidationError(
          `寄修单状态${repairOrder.status}不允许申请配件`
        );
      }

      const partIds = items.map((item: any) => item.partId);
      const parts = await tx.part.findMany({
        where: { id: { in: partIds }, isActive: true },
        select: { id: true, name: true, unitPrice: true },
      });

      if (parts.length !== partIds.length) {
        const missingIds = partIds.filter(
          (id: string) => !parts.some((p) => p.id === id)
        );
        throw new ValidationError(`配件不存在或已停用: ${missingIds.join(', ')}`);
      }

      const applicationNo = generateApplicationNo();

      const application = await tx.partApplication.create({
        data: {
          applicationNo,
          repairOrderId,
          title,
          description,
          urgencyLevel,
          expectedPickupDate: expectedPickupDate
            ? new Date(expectedPickupDate)
            : null,
          createdBy: req.user!.userId,
          status: PartApplicationStatus.DRAFT,
          items: {
            create: items.map((item: any) => ({
              partId: item.partId,
              requestedQty: item.requestedQty,
              remark: item.remark,
            })),
          },
        },
        include: {
          items: { include: { part: true } },
          repairOrder: {
            select: { id: true, orderNo: true, status: true },
          },
          creator: { select: { id: true, realName: true, role: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: PartApplicationStatus.DRAFT,
          changedBy: req.user!.userId,
          changeReason: '创建申请单',
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: note,
            applicationId: application.id,
            createdBy: req.user!.userId,
          },
        });
      }

      return application;
    });

    return res.json(success(req, result, '配件申请创建成功（草稿状态）'));
  } catch (error) {
    next(error);
  }
}

export async function submitApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.partApplication.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!application) {
        throw new NotFoundError('申请单不存在');
      }

      if (application.createdBy !== req.user!.userId && req.user!.role !== 'ADMIN') {
        if (application.createdBy !== req.user!.userId) {
          throw new AppError(403, '只能提交自己创建的申请单');
        }
      }

      if (application.status !== PartApplicationStatus.DRAFT) {
        throw new ValidationError(
          `当前状态${application.status}不允许提交审批`
        );
      }

      const updated = await tx.partApplication.update({
        where: { id },
        data: { status: PartApplicationStatus.PENDING_APPROVAL },
        include: {
          items: { include: { part: true } },
          repairOrder: {
            select: { id: true, orderNo: true, status: true },
          },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: PartApplicationStatus.DRAFT,
          toStatus: PartApplicationStatus.PENDING_APPROVAL,
          changedBy: req.user!.userId,
          changeReason: '提交审批',
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: `提交说明: ${note}`,
            applicationId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      return updated;
    });

    return res.json(success(req, result, '申请已提交，等待审批'));
  } catch (error) {
    next(error);
  }
}

export async function getApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const application = await prisma.partApplication.findUnique({
      where: { id },
      include: {
        items: { include: { part: true } },
        repairOrder: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            watch: { select: { id: true, brand: true, model: true, serialNumber: true } },
          },
        },
        creator: { select: { id: true, realName: true, role: true } },
        approver: { select: { id: true, realName: true, role: true } },
        statusHistories: {
          orderBy: { createdAt: 'desc' },
        },
        inventoryLocks: {
          include: {
            inventory: { include: { part: true } },
            locker: { select: { id: true, realName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, realName: true, role: true } },
          },
        },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, realName: true, role: true } },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundError('申请单不存在');
    }

    return res.json(success(req, application));
  } catch (error) {
    next(error);
  }
}

export async function getApplicationList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const {
      status,
      repairOrderId,
      urgencyLevel,
      createdBy,
      approvedBy,
      startDate,
      endDate,
    } = req.query as any;

    const where: any = {};

    if (status) where.status = status;
    if (repairOrderId) where.repairOrderId = repairOrderId;
    if (urgencyLevel) where.urgencyLevel = urgencyLevel;
    if (createdBy) where.createdBy = createdBy;
    if (approvedBy) where.approvedBy = approvedBy;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [applications, total] = await Promise.all([
      prisma.partApplication.findMany({
        where,
        skip,
        take,
        include: {
          items: { include: { part: true } },
          repairOrder: {
            select: { id: true, orderNo: true, status: true },
          },
          creator: { select: { id: true, realName: true } },
          _count: { select: { inventoryLocks: true, notes: true } },
        },
        orderBy: [
          {
            urgencyLevel: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      }),
      prisma.partApplication.count({ where }),
    ]);

    return res.json(
      successWithPagination(req, applications, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function updateApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { items, expectedPickupDate, ...data } = req.body;

    const application = await prisma.partApplication.findUnique({
      where: { id },
      select: { id: true, status: true, createdBy: true },
    });

    if (!application) {
      throw new NotFoundError('申请单不存在');
    }

    if (application.status !== PartApplicationStatus.DRAFT) {
      throw new ValidationError(`当前状态${application.status}不允许编辑`);
    }

    const result = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.partApplicationItem.deleteMany({
          where: { applicationId: id },
        });
      }

      const updated = await tx.partApplication.update({
        where: { id },
        data: {
          ...data,
          expectedPickupDate: expectedPickupDate
            ? new Date(expectedPickupDate)
            : undefined,
          items: items
            ? {
                create: items.map((item: any) => ({
                  partId: item.partId,
                  requestedQty: item.requestedQty,
                  remark: item.remark,
                })),
              }
            : undefined,
        },
        include: {
          items: { include: { part: true } },
        },
      });

      return updated;
    });

    return res.json(success(req, result, '申请单更新成功'));
  } catch (error) {
    next(error);
  }
}

export async function approveApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { items, note } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.partApplication.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!application) {
        throw new NotFoundError('申请单不存在');
      }

      if (application.status !== PartApplicationStatus.PENDING_APPROVAL) {
        throw new ValidationError(`当前状态${application.status}不允许审批`);
      }

      const approveItems = items;
      const existingItemIds = application.items.map((item) => item.id);

      for (const ai of approveItems) {
        if (!existingItemIds.includes(ai.itemId)) {
          throw new ValidationError(`明细ID不存在: ${ai.itemId}`);
        }
      }

      const totalApproved = approveItems.reduce(
        (sum: number, ai: any) => sum + ai.approvedQty,
        0
      );
      const totalRequested = application.items.reduce(
        (sum, item) => sum + item.requestedQty,
        0
      );

      let newStatus: PartApplicationStatus;
      if (totalApproved === 0) {
        throw new ValidationError('批准数量不能全为0，如需驳回请使用驳回接口');
      } else if (totalApproved < totalRequested) {
        newStatus = PartApplicationStatus.PARTIAL_APPROVED;
      } else {
        newStatus = PartApplicationStatus.APPROVED;
      }

      for (const ai of approveItems) {
        await tx.partApplicationItem.update({
          where: { id: ai.itemId },
          data: {
            approvedQty: ai.approvedQty,
            remark: ai.remark,
          },
        });

        if (ai.approvedQty > 0) {
          const appItem = application.items.find((item) => item.id === ai.itemId);
          if (!appItem) continue;

          const inventory = await tx.inventory.findFirst({
            where: {
              partId: appItem.partId,
              warehouse: 'MAIN',
            },
            select: { id: true, quantity: true, reservedQty: true },
          });

          if (inventory) {
            const availableQty = inventory.quantity - inventory.reservedQty;
            const lockQty = Math.min(ai.approvedQty, availableQty);

            if (lockQty > 0) {
              const lockNo = generateLockNo();
              const expireAt = new Date();
              expireAt.setHours(
                expireAt.getHours() + config.inventory.lockDefaultDurationHours
              );

              await tx.inventoryLock.create({
                data: {
                  lockNo,
                  inventoryId: inventory.id,
                  quantity: lockQty,
                  status: InventoryLockStatus.ACTIVE,
                  reason: `配件申请审批通过: ${application.applicationNo}`,
                  lockedBy: req.user!.userId,
                  applicationId: application.id,
                  repairOrderId: application.repairOrderId,
                  expireAt,
                },
              });

              await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                  reservedQty: { increment: lockQty },
                },
              });
            }
          }
        }
      }

      const updated = await tx.partApplication.update({
        where: { id },
        data: {
          status: newStatus,
          approvedBy: req.user!.userId,
          approvedAt: new Date(),
        },
        include: {
          items: { include: { part: true } },
          repairOrder: { select: { id: true, orderNo: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: PartApplicationStatus.PENDING_APPROVAL,
          toStatus: newStatus,
          changedBy: req.user!.userId,
          changeReason: newStatus === PartApplicationStatus.PARTIAL_APPROVED
            ? '部分批准'
            : '全部批准',
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: `审批备注: ${note}`,
            applicationId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      const repairOrder = await tx.repairOrder.findUnique({
        where: { id: application.repairOrderId },
        select: { id: true, status: true },
      });

      if (
        repairOrder &&
        repairOrder.status === RepairOrderStatus.QUOTATION_APPROVED
      ) {
        await tx.repairOrder.update({
          where: { id: repairOrder.id },
          data: { status: RepairOrderStatus.AWAITING_PARTS },
        });

        await tx.repairStatusHistory.create({
          data: {
            repairOrderId: repairOrder.id,
            fromStatus: RepairOrderStatus.QUOTATION_APPROVED,
            toStatus: RepairOrderStatus.AWAITING_PARTS,
            changedBy: req.user!.userId,
            changeReason: '配件申请已提交，等待配件到货',
          },
        });
      }

      return {
        ...updated,
        approvalResult: {
          totalRequested,
          totalApproved,
          status: newStatus,
        },
      };
    });

    return res.json(
      success(
        req,
        result,
        result.approvalResult.status === PartApplicationStatus.PARTIAL_APPROVED
          ? '部分批准，已自动锁定可用库存'
          : '批准通过，已自动锁定可用库存'
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function rejectApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.partApplication.findUnique({
        where: { id },
        select: { id: true, status: true, applicationNo: true },
      });

      if (!application) {
        throw new NotFoundError('申请单不存在');
      }

      if (application.status !== PartApplicationStatus.PENDING_APPROVAL) {
        throw new ValidationError(`当前状态${application.status}不允许驳回`);
      }

      const updated = await tx.partApplication.update({
        where: { id },
        data: {
          status: PartApplicationStatus.REJECTED,
          rejectReason: reason,
          approvedBy: req.user!.userId,
          approvedAt: new Date(),
        },
        include: {
          items: { include: { part: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: PartApplicationStatus.PENDING_APPROVAL,
          toStatus: PartApplicationStatus.REJECTED,
          changedBy: req.user!.userId,
          changeReason: '驳回',
        },
      });

      await tx.note.create({
        data: {
          type: NoteType.REJECT_REASON,
          content: reason,
          applicationId: id,
          createdBy: req.user!.userId,
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: `驳回补充说明: ${note}`,
            applicationId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      return updated;
    });

    return res.json(success(req, result, '申请已驳回'));
  } catch (error) {
    next(error);
  }
}

export async function supplementApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { description, addItems, updateItems } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.partApplication.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!application) {
        throw new NotFoundError('申请单不存在');
      }

      if (application.status !== PartApplicationStatus.REJECTED) {
        throw new ValidationError(`当前状态${application.status}不允许补录`);
      }

      if (updateItems) {
        const existingItemIds = application.items.map((item) => item.id);
        for (const ui of updateItems) {
          if (!existingItemIds.includes(ui.itemId)) {
            throw new ValidationError(`明细ID不存在: ${ui.itemId}`);
          }
          await tx.partApplicationItem.update({
            where: { id: ui.itemId },
            data: {
              requestedQty: ui.requestedQty,
              remark: ui.remark,
            },
          });
        }
      }

      if (addItems && addItems.length > 0) {
        for (const ai of addItems) {
          await tx.partApplicationItem.create({
            data: {
              applicationId: id,
              partId: ai.partId,
              requestedQty: ai.requestedQty,
              remark: ai.remark,
            },
          });
        }
      }

      await tx.note.create({
        data: {
          type: NoteType.SUPPLEMENT_INFO,
          content: description,
          applicationId: id,
          createdBy: req.user!.userId,
        },
      });

      const updated = await tx.partApplication.update({
        where: { id },
        data: {
          description: application.description
            ? `${application.description}\n\n补录说明: ${description}`
            : description,
          status: PartApplicationStatus.PENDING_APPROVAL,
        },
        include: {
          items: { include: { part: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: PartApplicationStatus.REJECTED,
          toStatus: PartApplicationStatus.PENDING_APPROVAL,
          changedBy: req.user!.userId,
          changeReason: '补录完成，重新提交审批',
        },
      });

      return updated;
    });

    return res.json(success(req, result, '补录完成，已重新提交审批'));
  } catch (error) {
    next(error);
  }
}

export async function pickupApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { items, note } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.partApplication.findUnique({
        where: { id },
        include: {
          items: true,
          inventoryLocks: {
            where: { status: InventoryLockStatus.ACTIVE },
          },
        },
      });

      if (!application) {
        throw new NotFoundError('申请单不存在');
      }

      if (
        application.status !== PartApplicationStatus.APPROVED &&
        application.status !== PartApplicationStatus.PARTIAL_APPROVED &&
        application.status !== PartApplicationStatus.PROCESSING
      ) {
        throw new ValidationError(`当前状态${application.status}不允许取件`);
      }

      const existingItemIds = application.items.map((item) => item.id);

      for (const pi of items) {
        if (!existingItemIds.includes(pi.itemId)) {
          throw new ValidationError(`明细ID不存在: ${pi.itemId}`);
        }

        const appItem = application.items.find((item) => item.id === pi.itemId);
        if (!appItem) continue;

        if (pi.actualIssuedQty > (appItem.approvedQty || appItem.requestedQty)) {
          throw new ValidationError(
            `实际发放数量不能超过批准数量: ${appItem.partId}`
          );
        }

        await tx.partApplicationItem.update({
          where: { id: pi.itemId },
          data: {
            actualIssuedQty: pi.actualIssuedQty,
            unitPrice: pi.unitPrice,
          },
        });

        if (pi.actualIssuedQty > 0) {
          const activeLock = application.inventoryLocks.find(
            (lock) => lock.inventoryId
          );
          if (activeLock) {
            await tx.inventoryLock.update({
              where: { id: activeLock.id },
              data: {
                status: InventoryLockStatus.CONSUMED,
                consumedAt: new Date(),
              },
            });

            await tx.inventory.update({
              where: { id: activeLock.inventoryId },
              data: {
                quantity: { decrement: pi.actualIssuedQty },
                reservedQty: { decrement: pi.actualIssuedQty },
              },
            });
          }
        }
      }

      const allCompleted = application.items.every((item) =>
        items.some(
          (pi: any) =>
            pi.itemId === item.id &&
            pi.actualIssuedQty === (item.approvedQty || item.requestedQty)
        )
      );

      const newStatus = allCompleted
        ? PartApplicationStatus.COMPLETED
        : PartApplicationStatus.PROCESSING;

      const updated = await tx.partApplication.update({
        where: { id },
        data: {
          status: newStatus,
          actualPickupDate: new Date(),
        },
        include: {
          items: { include: { part: true } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: newStatus,
          changedBy: req.user!.userId,
          changeReason: allCompleted ? '配件全部发放完成' : '配件部分发放',
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: `取件备注: ${note}`,
            applicationId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      if (allCompleted) {
        const repairOrder = await tx.repairOrder.findUnique({
          where: { id: application.repairOrderId },
          select: { id: true, status: true },
        });

        if (
          repairOrder &&
          repairOrder.status === RepairOrderStatus.AWAITING_PARTS
        ) {
          await tx.repairOrder.update({
            where: { id: repairOrder.id },
            data: { status: RepairOrderStatus.IN_REPAIR },
          });

          await tx.repairStatusHistory.create({
            data: {
              repairOrderId: repairOrder.id,
              fromStatus: RepairOrderStatus.AWAITING_PARTS,
              toStatus: RepairOrderStatus.IN_REPAIR,
              changedBy: req.user!.userId,
              changeReason: '配件已到位，开始维修',
            },
          });
        }
      }

      return updated;
    });

    return res.json(success(req, result, '配件发放完成'));
  } catch (error) {
    next(error);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { type, content } = req.body;

    const application = await prisma.partApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundError('申请单不存在');
    }

    const note = await prisma.note.create({
      data: {
        type: type as NoteType,
        content,
        applicationId: id,
        createdBy: req.user!.userId,
      },
      include: {
        creator: { select: { id: true, realName: true, role: true } },
      },
    });

    return res.json(success(req, note, '备注已添加'));
  } catch (error) {
    next(error);
  }
}

export async function getStatusTransitions(_req: Request, res: Response) {
  return res.json(
    success(_req, VALID_STATUS_TRANSITIONS, '状态流转规则查询成功')
  );
}

export async function getMyPendingApprovals(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);

    const where = {
      status: PartApplicationStatus.PENDING_APPROVAL,
    };

    const [applications, total] = await Promise.all([
      prisma.partApplication.findMany({
        where,
        skip,
        take,
        include: {
          items: { include: { part: true } },
          repairOrder: {
            include: {
              customer: { select: { name: true, phone: true } },
              watch: { select: { brand: true, model: true } },
            },
          },
          creator: { select: { id: true, realName: true, role: true } },
        },
        orderBy: [
          { urgencyLevel: 'desc' },
          { createdAt: 'asc' },
        ],
      }),
      prisma.partApplication.count({ where }),
    ]);

    return res.json(
      successWithPagination(req, applications, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}
