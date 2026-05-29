import { Request } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  RefundOrderCreateDto,
  RefundOrderUpdateDto,
  RefundStatusUpdateDto,
  QueryFilterDto,
  RemarkCreateDto,
} from '../types/dto';
import {
  RefundStatus,
  ReturnStatus,
  OperationType,
  REFUND_STATUS_FLOW,
  REFUND_TRANSITION_PERMISSIONS,
  ErrorCodes,
  BusinessError,
  JwtPayload,
  calculatePagination,
  PaginatedResult,
  ExceptionType,
} from '../types';
import { generateRefundNo } from '../utils/orderNo';
import { createOperationLog } from './auditLog';

type RefundOrderWithRelations = any;

function validateStatusTransition(
  currentStatus: string,
  newStatus: RefundStatus,
  userRole: string
): void {
  const current = currentStatus as RefundStatus;
  const allowedNext = REFUND_STATUS_FLOW[current];
  if (!allowedNext.includes(newStatus)) {
    throw new BusinessError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      `不允许从 [${currentStatus}] 变更为 [${newStatus}]`
    );
  }

  const transitionKey = `${current}->${newStatus}`;
  const allowedRoles = REFUND_TRANSITION_PERMISSIONS[transitionKey];
  if (!allowedRoles || !allowedRoles.includes(userRole as never)) {
    throw new BusinessError(
      ErrorCodes.PERMISSION_DENIED,
      `当前角色无权限执行 [${current}]->[${newStatus}] 状态变更`
    );
  }
}

export async function createRefundOrder(
  dto: RefundOrderCreateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const returnOrder = await prisma.returnOrder.findUnique({
    where: { id: dto.returnOrderId },
    include: { refundOrder: true },
  });

  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '关联退货单不存在');
  }

  if (returnOrder.refundOrder) {
    throw new BusinessError(ErrorCodes.DUPLICATE_ERROR, '该退货单已创建退款单');
  }

  if (returnOrder.status !== ReturnStatus.APPROVED) {
    throw new BusinessError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      `退货单必须完成鉴定通过才能创建退款单，当前状态: [${returnOrder.status}]`
    );
  }

  const idempotencyKey = dto.idempotencyKey || (req as unknown as Record<string, unknown>).idempotencyKey as string;

  const refundOrder = await prisma.refundOrder.create({
    data: {
      refundNo: generateRefundNo(),
      returnOrderId: dto.returnOrderId,
      inquiryId: dto.inquiryId,
      status: RefundStatus.PENDING_REVIEW,
      refundAmount: dto.refundAmount,
      isCreditCustomer: dto.isCreditCustomer,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdById: user.userId,
      idempotencyKey,
    },
    include: getRefundOrderInclude(),
  });

  await createOperationLog(
    user,
    OperationType.CREATE,
    {
      inquiryId: dto.inquiryId,
      returnOrderId: dto.returnOrderId,
      refundOrderId: refundOrder.id,
      newStatus: refundOrder.status,
      detail: {
        refundAmount: dto.refundAmount,
        isCreditCustomer: dto.isCreditCustomer,
        dueDate: dto.dueDate,
      },
    },
    req
  );

  return refundOrder;
}

export async function updateRefundOrder(
  id: string,
  dto: RefundOrderUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const refundOrder = await prisma.refundOrder.findUnique({ where: { id } });
  if (!refundOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退款单不存在');
  }

  const editableStatuses = [
    RefundStatus.PENDING_REVIEW,
    RefundStatus.REVIEWING,
    RefundStatus.FAILED,
  ];

  if (!editableStatuses.includes(refundOrder.status as RefundStatus)) {
    throw new BusinessError(ErrorCodes.PERMISSION_DENIED, '当前状态不允许编辑');
  }

  const updateData: any = {
    handledById: user.userId,
  };

  if (dto.refundAmount !== undefined) updateData.refundAmount = dto.refundAmount;
  if (dto.actualRefundAmount !== undefined) updateData.actualRefundAmount = dto.actualRefundAmount;
  if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
  if (dto.paymentTraceNo !== undefined) updateData.paymentTraceNo = dto.paymentTraceNo;
  if (dto.reviewResult !== undefined) updateData.reviewResult = dto.reviewResult;
  if (dto.rejectReason !== undefined) updateData.rejectReason = dto.rejectReason;
  if (dto.supplementNote !== undefined) updateData.supplementNote = dto.supplementNote;
  if (dto.isCreditCustomer !== undefined) updateData.isCreditCustomer = dto.isCreditCustomer;
  if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
  if (dto.hasDelay !== undefined) updateData.hasDelay = dto.hasDelay;
  if (dto.delayDays !== undefined) updateData.delayDays = dto.delayDays;
  if (dto.hasException !== undefined) updateData.hasException = dto.hasException;
  if (dto.exceptionType !== undefined) updateData.exceptionType = dto.exceptionType;
  if (dto.exceptionNote !== undefined) updateData.exceptionNote = dto.exceptionNote;

  const updated = await prisma.refundOrder.update({
    where: { id },
    data: updateData,
    include: getRefundOrderInclude(),
  });

  await createOperationLog(
    user,
    OperationType.UPDATE,
    {
      inquiryId: refundOrder.inquiryId,
      refundOrderId: id,
      oldStatus: refundOrder.status,
      newStatus: updated.status,
      detail: { updatedFields: Object.keys(dto) },
    },
    req
  );

  return updated;
}

export async function updateRefundOrderStatus(
  id: string,
  dto: RefundStatusUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const refundOrder = await prisma.refundOrder.findUnique({ where: { id } });
  if (!refundOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退款单不存在');
  }

  validateStatusTransition(refundOrder.status, dto.status, user.role);

  const updateData: any = {
    status: dto.status,
    handledById: user.userId,
  };

  if (dto.status === RefundStatus.APPROVED || dto.status === RefundStatus.REVIEWING) {
    updateData.reviewDate = new Date();
    updateData.reviewById = user.userId;
  }

  if (dto.status === RefundStatus.PAID) {
    updateData.paymentDate = new Date();
  }

  if (dto.reviewResult) updateData.reviewResult = dto.reviewResult;
  if (dto.rejectReason) updateData.rejectReason = dto.rejectReason;
  if (dto.actualRefundAmount !== undefined) updateData.actualRefundAmount = dto.actualRefundAmount;
  if (dto.paymentMethod) updateData.paymentMethod = dto.paymentMethod;
  if (dto.paymentTraceNo) updateData.paymentTraceNo = dto.paymentTraceNo;

  if (dto.status === RefundStatus.REJECTED) {
    updateData.hasException = true;
    updateData.exceptionType = ExceptionType.OTHER;
  }

  if (dto.status === RefundStatus.FAILED) {
    updateData.hasException = true;
    updateData.exceptionType = ExceptionType.PAYMENT_DELAY;
  }

  const updated = await prisma.refundOrder.update({
    where: { id },
    data: updateData,
    include: getRefundOrderInclude(),
  });

  const operationType = dto.status === RefundStatus.APPROVED
    ? OperationType.APPROVE
    : dto.status === RefundStatus.REJECTED
    ? OperationType.REJECT
    : dto.status === RefundStatus.PAID
    ? OperationType.PAY
    : OperationType.UPDATE;

  await createOperationLog(
    user,
    operationType,
    {
      inquiryId: refundOrder.inquiryId,
      refundOrderId: id,
      oldStatus: refundOrder.status,
      newStatus: dto.status,
      detail: {
        reviewResult: dto.reviewResult,
        rejectReason: dto.rejectReason,
        actualRefundAmount: dto.actualRefundAmount,
        paymentMethod: dto.paymentMethod,
        paymentTraceNo: dto.paymentTraceNo,
        remark: dto.remark,
      },
    },
    req
  );

  if (dto.remark) {
    await prisma.remark.create({
      data: {
        content: dto.remark,
        createdById: user.userId,
        refundOrderId: id,
      },
    });
  }

  return updated;
}

export async function getRefundOrder(id: string): Promise<any> {
  const refundOrder = await prisma.refundOrder.findUnique({
    where: { id },
    include: getRefundOrderInclude(),
  });

  if (!refundOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退款单不存在');
  }

  return refundOrder;
}

export async function getRefundOrderByInquiry(inquiryId: string): Promise<any | null> {
  return prisma.refundOrder.findUnique({
    where: { inquiryId },
    include: getRefundOrderInclude(),
  });
}

export async function getRefundOrderByReturn(returnOrderId: string): Promise<any | null> {
  return prisma.refundOrder.findUnique({
    where: { returnOrderId },
    include: getRefundOrderInclude(),
  });
}

export async function getRefundOrderList(
  filters: QueryFilterDto,
  _user: JwtPayload
): Promise<any> {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    keyword,
    status,
    startDate,
    endDate,
    hasException,
  } = filters;

  const where: Prisma.RefundOrderWhereInput = {};

  if (keyword) {
    where.OR = [
      { refundNo: { contains: keyword } },
      { returnOrder: { returnNo: { contains: keyword } } },
      { inquiry: { inquiryNo: { contains: keyword } } },
      { inquiry: { customerName: { contains: keyword } } },
    ];
  }

  if (status && status.length > 0) {
    where.status = { in: status };
  }

  if (startDate) {
    where.createdAt = { ...where.createdAt as object, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt as object, lte: new Date(`${endDate}T23:59:59.999Z`) };
  }

  if (hasException !== undefined) {
    where.hasException = hasException;
  }

  const include = {
    returnOrder: { select: { id: true, returnNo: true, returnReason: true } },
    inquiry: { select: { id: true, inquiryNo: true, customerName: true, status: true } },
    createdBy: { select: { realName: true, role: true } },
    reviewBy: { select: { realName: true } },
  };

  const [total, items] = await Promise.all([
    prisma.refundOrder.count({ where }),
    prisma.refundOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include,
    }),
  ]);

  const pagination = calculatePagination(total, page, pageSize);
  return { items, pagination };
}

export async function addRefundOrderRemark(
  id: string,
  dto: RemarkCreateDto,
  user: JwtPayload,
  req?: Request
) {
  const refundOrder = await prisma.refundOrder.findUnique({ where: { id } });
  if (!refundOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退款单不存在');
  }

  const remark = await prisma.remark.create({
    data: {
      content: dto.content,
      isImportant: dto.isImportant,
      createdById: user.userId,
      refundOrderId: id,
    },
    include: {
      createdBy: { select: { realName: true, role: true } },
    },
  });

  await createOperationLog(
    user,
    OperationType.ADD_REMARK,
    {
      inquiryId: refundOrder.inquiryId,
      refundOrderId: id,
      detail: { content: dto.content, isImportant: dto.isImportant },
    },
    req
  );

  return remark;
}

function getRefundOrderInclude(): any {
  return {
    returnOrder: {
      select: {
        id: true,
        returnNo: true,
        returnReason: true,
        status: true,
        applyRefundAmount: true,
        originalAmount: true,
        items: true,
        inquiry: {
          select: {
            id: true,
            inquiryNo: true,
            customerName: true,
            carModel: true,
            vinNo: true,
            stockLock: { select: { id: true, lockNo: true, status: true } },
          },
        },
      },
    },
    inquiry: {
      select: {
        id: true,
        inquiryNo: true,
        customerName: true,
        status: true,
      },
    },
    createdBy: { select: { id: true, realName: true, role: true } },
    handledBy: { select: { id: true, realName: true, role: true } },
    reviewBy: { select: { id: true, realName: true, role: true } },
    operationLogs: {
      take: 20,
      orderBy: { createdAt: 'desc' as const },
    },
    remarks: {
      include: { createdBy: { select: { realName: true, role: true } } },
      orderBy: [{ isImportant: 'desc' as const }, { createdAt: 'desc' as const }],
    },
    evidences: true,
  };
}
