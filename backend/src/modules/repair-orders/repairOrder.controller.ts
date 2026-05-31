import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { generateRepairOrderNo } from '../../utils/orderNo';
import { parsePagination } from '../../utils/pagination';
import { success, successWithPagination } from '../../utils/response';
import { AppError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { RepairOrderStatus, NoteType } from '../../types/enums';

const VALID_STATUS_TRANSITIONS: Record<RepairOrderStatus, RepairOrderStatus[]> = {
  [RepairOrderStatus.PENDING_QUOTATION]: [
    RepairOrderStatus.QUOTATION_SENT,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.QUOTATION_SENT]: [
    RepairOrderStatus.QUOTATION_APPROVED,
    RepairOrderStatus.QUOTATION_REJECTED,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.QUOTATION_APPROVED]: [
    RepairOrderStatus.AWAITING_PARTS,
    RepairOrderStatus.IN_REPAIR,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.QUOTATION_REJECTED]: [
    RepairOrderStatus.QUOTATION_SENT,
    RepairOrderStatus.CLOSED,
  ],
  [RepairOrderStatus.AWAITING_PARTS]: [
    RepairOrderStatus.IN_REPAIR,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.IN_REPAIR]: [
    RepairOrderStatus.REPAIR_COMPLETED,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.REPAIR_COMPLETED]: [
    RepairOrderStatus.READY_FOR_PICKUP,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.READY_FOR_PICKUP]: [
    RepairOrderStatus.PICKED_UP,
    RepairOrderStatus.CANCELLED,
  ],
  [RepairOrderStatus.PICKED_UP]: [
    RepairOrderStatus.CLOSED,
  ],
  [RepairOrderStatus.CLOSED]: [],
  [RepairOrderStatus.CANCELLED]: [],
};

export async function createRepairOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { customer, watch, estimatedDeliveryDate, assignedTo, technician, note, ...orderData } = req.body;

    const orderNo = generateRepairOrderNo();

    const result = await prisma.$transaction(async (tx) => {
      let customerRecord = await tx.customer.findUnique({
        where: { phone: customer.phone },
      });

      if (!customerRecord) {
        customerRecord = await tx.customer.create({
          data: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
          },
        });
      } else {
        customerRecord = await tx.customer.update({
          where: { id: customerRecord.id },
          data: {
            name: customer.name,
            email: customer.email || customerRecord.email,
            address: customer.address || customerRecord.address,
          },
        });
      }

      let watchRecord = await tx.watch.findUnique({
        where: { serialNumber: watch.serialNumber },
      });

      if (!watchRecord) {
        watchRecord = await tx.watch.create({
          data: {
            brand: watch.brand,
            model: watch.model,
            serialNumber: watch.serialNumber,
            movementType: watch.movementType,
            productionYear: watch.productionYear,
            caseMaterial: watch.caseMaterial,
            strapType: watch.strapType,
            description: watch.description,
          },
        });
      }

      const repairOrder = await tx.repairOrder.create({
        data: {
          orderNo,
          customerId: customerRecord.id,
          watchId: watchRecord.id,
          problemDescription: orderData.problemDescription,
          appearanceCondition: orderData.appearanceCondition,
          accessories: orderData.accessories,
          estimatedCost: orderData.estimatedCost,
          receivedBy: req.user!.userId,
          assignedTo,
          technician,
          estimatedDeliveryDate: estimatedDeliveryDate
            ? new Date(estimatedDeliveryDate)
            : null,
        },
        include: {
          customer: true,
          watch: true,
          receiver: { select: { id: true, realName: true, role: true } },
          assignee: { select: { id: true, realName: true, role: true } },
          tech: { select: { id: true, realName: true, role: true } },
          statusHistories: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });

      await tx.repairStatusHistory.create({
        data: {
          repairOrderId: repairOrder.id,
          fromStatus: null,
          toStatus: RepairOrderStatus.PENDING_QUOTATION,
          changedBy: req.user!.userId,
          changeReason: '创建寄修单',
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: note,
            repairOrderId: repairOrder.id,
            createdBy: req.user!.userId,
          },
        });
      }

      return repairOrder;
    });

    return res.json(success(req, result, '寄修单创建成功'));
  } catch (error) {
    next(error);
  }
}

export async function getRepairOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        watch: true,
        receiver: { select: { id: true, realName: true, role: true } },
        assignee: { select: { id: true, realName: true, role: true } },
        tech: { select: { id: true, realName: true, role: true } },
        statusHistories: {
          orderBy: { createdAt: 'desc' },
          include: {
            changer: { select: { id: true, realName: true, role: true } },
          },
        },
        applications: {
          include: {
            items: { include: { part: true } },
            statusHistories: { orderBy: { createdAt: 'desc' }, take: 5 },
            inventoryLocks: {
              where: { status: 'ACTIVE' },
              include: {
                inventory: { include: { part: true } },
                locker: { select: { id: true, realName: true } },
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, realName: true, role: true } },
          },
        },
      },
    });

    if (!repairOrder) {
      throw new NotFoundError('寄修单不存在');
    }

    const operationLogs = await prisma.operationLog.findMany({
      where: {
        resourceType: 'repairOrder',
        resourceId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, realName: true, role: true } },
      },
    });

    return res.json(success(req, { ...repairOrder, operationLogs }));
  } catch (error) {
    next(error);
  }
}

export async function getRepairOrderList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const {
      status,
      customerName,
      customerPhone,
      watchBrand,
      watchSerial,
      receivedBy,
      assignedTo,
      technician,
      startDate,
      endDate,
    } = req.query as any;

    const where: any = {};

    if (status) where.status = status;
    if (receivedBy) where.receivedBy = receivedBy;
    if (assignedTo) where.assignedTo = assignedTo;
    if (technician) where.technician = technician;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (customerName || customerPhone) {
      where.customer = {
        AND: [],
      };
      if (customerName) where.customer.AND.push({ name: { contains: customerName } });
      if (customerPhone) where.customer.AND.push({ phone: { contains: customerPhone } });
    }

    if (watchBrand || watchSerial) {
      where.watch = {
        AND: [],
      };
      if (watchBrand) where.watch.AND.push({ brand: { contains: watchBrand } });
      if (watchSerial) where.watch.AND.push({ serialNumber: { contains: watchSerial } });
    }

    const [orders, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          watch: { select: { id: true, brand: true, model: true, serialNumber: true } },
          receiver: { select: { id: true, realName: true } },
          assignee: { select: { id: true, realName: true } },
          tech: { select: { id: true, realName: true } },
          _count: {
            select: { applications: true, notes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.repairOrder.count({ where }),
    ]);

    return res.json(
      successWithPagination(req, orders, {
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

export async function updateRepairOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const repairOrder = await prisma.repairOrder.findUnique({ where: { id } });
    if (!repairOrder) {
      throw new NotFoundError('寄修单不存在');
    }

    const updated = await prisma.repairOrder.update({
      where: { id },
      data: {
        ...data,
        estimatedDeliveryDate: data.estimatedDeliveryDate
          ? new Date(data.estimatedDeliveryDate)
          : undefined,
      },
      include: {
        customer: true,
        watch: true,
      },
    });

    return res.json(success(req, updated, '寄修单更新成功'));
  } catch (error) {
    next(error);
  }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, changeReason, note } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const repairOrder = await tx.repairOrder.findUnique({
        where: { id },
        select: { id: true, status: true, orderNo: true },
      });

      if (!repairOrder) {
        throw new NotFoundError('寄修单不存在');
      }

      const validTransitions = VALID_STATUS_TRANSITIONS[repairOrder.status as RepairOrderStatus];
      if (!validTransitions.includes(status)) {
        throw new ValidationError(
          `状态流转不合法: ${repairOrder.status} -> ${status}。` +
          `合法流转: ${validTransitions.join(', ') || '无'}`
        );
      }

      const updateData: any = { status };

      if (status === RepairOrderStatus.QUOTATION_SENT) {
        updateData.quotationDate = new Date();
      } else if (status === RepairOrderStatus.QUOTATION_APPROVED) {
        updateData.customerConfirmDate = new Date();
      } else if (status === RepairOrderStatus.REPAIR_COMPLETED) {
        updateData.actualDeliveryDate = new Date();
      } else if (status === RepairOrderStatus.PICKED_UP) {
        updateData.pickupDate = new Date();
      }

      const updated = await tx.repairOrder.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          watch: true,
        },
      });

      await tx.repairStatusHistory.create({
        data: {
          repairOrderId: id,
          fromStatus: repairOrder.status,
          toStatus: status,
          changedBy: req.user!.userId,
          changeReason: changeReason || '状态变更',
        },
      });

      if (note) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: note,
            repairOrderId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      return updated;
    });

    return res.json(success(req, result, `状态已更新为: ${status}`));
  } catch (error) {
    next(error);
  }
}

export async function submitQuotation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { estimatedCost, estimatedDeliveryDate, description } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const repairOrder = await tx.repairOrder.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!repairOrder) {
        throw new NotFoundError('寄修单不存在');
      }

      if (repairOrder.status !== RepairOrderStatus.PENDING_QUOTATION) {
        throw new ValidationError(`当前状态${repairOrder.status}不允许提交报价`);
      }

      const updated = await tx.repairOrder.update({
        where: { id },
        data: {
          estimatedCost,
          estimatedDeliveryDate: estimatedDeliveryDate
            ? new Date(estimatedDeliveryDate)
            : null,
          status: RepairOrderStatus.QUOTATION_SENT,
          quotationDate: new Date(),
        },
        include: {
          customer: true,
          watch: true,
        },
      });

      await tx.repairStatusHistory.create({
        data: {
          repairOrderId: id,
          fromStatus: RepairOrderStatus.PENDING_QUOTATION,
          toStatus: RepairOrderStatus.QUOTATION_SENT,
          changedBy: req.user!.userId,
          changeReason: '提交报价',
        },
      });

      if (description) {
        await tx.note.create({
          data: {
            type: NoteType.INTERNAL,
            content: `报价说明: ${description}`,
            repairOrderId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      return updated;
    });

    return res.json(success(req, result, '报价已提交'));
  } catch (error) {
    next(error);
  }
}

export async function customerConfirmQuotation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { confirmed, rejectReason } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const repairOrder = await tx.repairOrder.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!repairOrder) {
        throw new NotFoundError('寄修单不存在');
      }

      if (repairOrder.status !== RepairOrderStatus.QUOTATION_SENT) {
        throw new ValidationError(`当前状态${repairOrder.status}不允许确认报价`);
      }

      const newStatus = confirmed
        ? RepairOrderStatus.QUOTATION_APPROVED
        : RepairOrderStatus.QUOTATION_REJECTED;

      const updated = await tx.repairOrder.update({
        where: { id },
        data: {
          status: newStatus,
          customerConfirmDate: new Date(),
        },
        include: {
          customer: true,
          watch: true,
        },
      });

      await tx.repairStatusHistory.create({
        data: {
          repairOrderId: id,
          fromStatus: RepairOrderStatus.QUOTATION_SENT,
          toStatus: newStatus,
          changedBy: req.user!.userId,
          changeReason: confirmed ? '客户确认接受报价' : '客户拒绝报价',
        },
      });

      if (rejectReason) {
        await tx.note.create({
          data: {
            type: NoteType.REJECT_REASON,
            content: rejectReason,
            repairOrderId: id,
            createdBy: req.user!.userId,
          },
        });
      }

      return updated;
    });

    return res.json(
      success(req, result, confirmed ? '客户已确认报价' : '客户已拒绝报价')
    );
  } catch (error) {
    next(error);
  }
}

export async function submitSatisfaction(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { score, note } = req.body;

    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!repairOrder) {
      throw new NotFoundError('寄修单不存在');
    }

    if (
      repairOrder.status !== RepairOrderStatus.PICKED_UP &&
      repairOrder.status !== RepairOrderStatus.CLOSED
    ) {
      throw new ValidationError(`当前状态${repairOrder.status}不允许提交满意度`);
    }

    const updated = await prisma.repairOrder.update({
      where: { id },
      data: {
        satisfactionScore: score,
        satisfactionNote: note,
      },
      include: {
        customer: true,
        watch: true,
      },
    });

    return res.json(success(req, updated, '满意度已提交'));
  } catch (error) {
    next(error);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { type, content } = req.body;

    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id },
    });

    if (!repairOrder) {
      throw new NotFoundError('寄修单不存在');
    }

    const validNoteTypes = Object.values(NoteType);
    if (type && !validNoteTypes.includes(type as NoteType)) {
      throw new ValidationError(`无效的备注类型: ${type}，有效值: ${validNoteTypes.join(', ')}`);
    }

    const note = await prisma.note.create({
      data: {
        type: type as NoteType || NoteType.INTERNAL,
        content,
        repairOrderId: id,
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
