import { Request } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  ReturnOrderCreateDto,
  ReturnOrderUpdateDto,
  ReturnStatusUpdateDto,
  ReturnItemInspectDto,
  QueryFilterDto,
  RemarkCreateDto,
  EvidenceCreateDto,
} from '../types/dto';
import {
  ReturnStatus,
  StockLockStatus,
  OperationType,
  RETURN_STATUS_FLOW,
  RETURN_TRANSITION_PERMISSIONS,
  ErrorCodes,
  BusinessError,
  JwtPayload,
  calculatePagination,
  PaginatedResult,
  ExceptionType,
} from '../types';
import { generateReturnNo } from '../utils/orderNo';
import { createOperationLog } from './auditLog';

type ReturnOrderWithRelations = any;

function validateStatusTransition(
  currentStatus: string,
  newStatus: ReturnStatus,
  userRole: string
): void {
  const current = currentStatus as ReturnStatus;
  const allowedNext = RETURN_STATUS_FLOW[current];
  if (!allowedNext.includes(newStatus)) {
    throw new BusinessError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      `不允许从 [${currentStatus}] 变更为 [${newStatus}]`
    );
  }

  const transitionKey = `${current}->${newStatus}`;
  const allowedRoles = RETURN_TRANSITION_PERMISSIONS[transitionKey];
  if (!allowedRoles || !allowedRoles.includes(userRole as never)) {
    throw new BusinessError(
      ErrorCodes.PERMISSION_DENIED,
      `当前角色无权限执行 [${current}]->[${newStatus}] 状态变更`
    );
  }
}

export async function createReturnOrder(
  dto: ReturnOrderCreateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: dto.inquiryId },
    include: { returnOrder: true, stockLock: true },
  });

  if (!inquiry) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '关联询价单不存在');
  }

  if (inquiry.returnOrder) {
    throw new BusinessError(ErrorCodes.DUPLICATE_ERROR, '该询价单已创建退货单');
  }

  if (!inquiry.stockLock) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '该询价单尚未创建锁库单');
  }

  if (inquiry.stockLock.status !== StockLockStatus.SOLD) {
    throw new BusinessError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      `锁库单必须完成出库才能创建退货单，当前状态: [${inquiry.stockLock.status}]`
    );
  }

  const idempotencyKey = dto.idempotencyKey || (req as unknown as Record<string, unknown>).idempotencyKey as string;

  const items = dto.items.map(item => ({
    ...item,
    subTotal: item.returnQuantity * item.unitPrice,
  }));

  const hasException = checkForExceptions(dto);

  const returnOrder = await prisma.returnOrder.create({
    data: {
      returnNo: generateReturnNo(),
      inquiryId: dto.inquiryId,
      status: ReturnStatus.PENDING_IDENTIFY,
      returnReason: dto.returnReason,
      returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
      originalSalesDate: dto.originalSalesDate ? new Date(dto.originalSalesDate) : null,
      originalAmount: dto.originalAmount,
      applyRefundAmount: dto.applyRefundAmount,
      supplementNote: dto.supplementNote,
      hasException,
      exceptionType: hasException ? detectExceptionType(dto) : null,
      createdById: user.userId,
      idempotencyKey,
      items: {
        create: items,
      },
    },
    include: getReturnOrderInclude(),
  });

  await createOperationLog(
    user,
    OperationType.CREATE,
    {
      inquiryId: dto.inquiryId,
      returnOrderId: returnOrder.id,
      newStatus: returnOrder.status,
      detail: {
        returnReason: dto.returnReason,
        applyRefundAmount: dto.applyRefundAmount,
        hasException,
      },
    },
    req
  );

  return returnOrder;
}

export async function updateReturnOrder(
  id: string,
  dto: ReturnOrderUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const returnOrder = await prisma.returnOrder.findUnique({ where: { id } });
  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货单不存在');
  }

  const editableStatuses = [
    ReturnStatus.PENDING_IDENTIFY,
    ReturnStatus.REWORK,
  ];

  if (!editableStatuses.includes(returnOrder.status as ReturnStatus)) {
    throw new BusinessError(ErrorCodes.PERMISSION_DENIED, '只能编辑待鉴定或需补录状态的退货单');
  }

  const updateData: any = {
    handledById: user.userId,
  };

  if (dto.returnReason !== undefined) updateData.returnReason = dto.returnReason;
  if (dto.originalSalesDate !== undefined) updateData.originalSalesDate = new Date(dto.originalSalesDate);
  if (dto.applyRefundAmount !== undefined) updateData.applyRefundAmount = dto.applyRefundAmount;
  if (dto.identifyResult !== undefined) updateData.identifyResult = dto.identifyResult;
  if (dto.rejectReason !== undefined) updateData.rejectReason = dto.rejectReason;
  if (dto.supplementNote !== undefined) updateData.supplementNote = dto.supplementNote;
  if (dto.reworkNote !== undefined) updateData.reworkNote = dto.reworkNote;
  if (dto.hasException !== undefined) updateData.hasException = dto.hasException;
  if (dto.exceptionType !== undefined) updateData.exceptionType = dto.exceptionType;
  if (dto.exceptionNote !== undefined) updateData.exceptionNote = dto.exceptionNote;

  if (dto.items) {
    updateData.items = {
      deleteMany: {},
      create: dto.items.map(item => ({
        ...item,
        subTotal: item.returnQuantity * item.unitPrice,
      })),
    };
  }

  const updated = await prisma.returnOrder.update({
    where: { id },
    data: updateData,
    include: getReturnOrderInclude(),
  });

  await createOperationLog(
    user,
    OperationType.UPDATE,
    {
      inquiryId: returnOrder.inquiryId,
      returnOrderId: id,
      oldStatus: returnOrder.status,
      newStatus: updated.status,
      detail: { updatedFields: Object.keys(dto) },
    },
    req
  );

  return updated;
}

export async function updateReturnOrderStatus(
  id: string,
  dto: ReturnStatusUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const returnOrder = await prisma.returnOrder.findUnique({ where: { id } });
  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货单不存在');
  }

  validateStatusTransition(returnOrder.status, dto.status, user.role);

  const updateData: any = {
    status: dto.status,
    handledById: user.userId,
  };

  if (dto.status === ReturnStatus.APPROVED || dto.status === ReturnStatus.IDENTIFYING) {
    updateData.identifyDate = new Date();
    updateData.identifyById = user.userId;
  }

  if (dto.identifyResult) updateData.identifyResult = dto.identifyResult;
  if (dto.rejectReason) updateData.rejectReason = dto.rejectReason;
  if (dto.reworkNote) updateData.reworkNote = dto.reworkNote;

  if (dto.status === ReturnStatus.REJECTED || dto.status === ReturnStatus.REWORK) {
    updateData.hasException = true;
    updateData.exceptionType = dto.status === ReturnStatus.REJECTED
      ? ExceptionType.NO_EVIDENCE
      : ExceptionType.OTHER;
  }

  const updated = await prisma.returnOrder.update({
    where: { id },
    data: updateData,
    include: getReturnOrderInclude(),
  });

  const operationType = dto.status === ReturnStatus.APPROVED
    ? OperationType.APPROVE
    : dto.status === ReturnStatus.REJECTED
    ? OperationType.REJECT
    : dto.status === ReturnStatus.REWORK
    ? OperationType.REWORK
    : OperationType.UPDATE;

  await createOperationLog(
    user,
    operationType,
    {
      inquiryId: returnOrder.inquiryId,
      returnOrderId: id,
      oldStatus: returnOrder.status,
      newStatus: dto.status,
      detail: {
        identifyResult: dto.identifyResult,
        rejectReason: dto.rejectReason,
        reworkNote: dto.reworkNote,
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
        returnOrderId: id,
      },
    });
  }

  return updated;
}

export async function inspectReturnItem(
  returnOrderId: string,
  itemId: string,
  dto: ReturnItemInspectDto,
  user: JwtPayload,
  req?: Request
) {
  const returnOrder = await prisma.returnOrder.findUnique({ where: { id: returnOrderId } });
  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货单不存在');
  }

  const item = await prisma.returnItem.findUnique({
    where: { id: itemId, returnOrderId },
  });

  if (!item) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货明细不存在');
  }

  const updated = await prisma.returnItem.update({
    where: { id: itemId },
    data: {
      inspectionResult: dto.inspectionResult,
      inspectionNote: dto.inspectionNote,
      inspected: dto.inspected,
      inspectedById: user.userId,
      inspectedAt: new Date(),
    },
  });

  await createOperationLog(
    user,
    OperationType.INSPECT,
    {
      inquiryId: returnOrder.inquiryId,
      returnOrderId,
      detail: {
        itemId,
        partName: item.partName,
        inspectionResult: dto.inspectionResult,
        inspectionNote: dto.inspectionNote,
      },
    },
    req
  );

  return updated;
}

export async function getReturnOrder(id: string): Promise<any> {
  const returnOrder = await prisma.returnOrder.findUnique({
    where: { id },
    include: getReturnOrderInclude(),
  });

  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货单不存在');
  }

  return returnOrder;
}

export async function getReturnOrderByInquiry(inquiryId: string): Promise<any | null> {
  return prisma.returnOrder.findUnique({
    where: { inquiryId },
    include: getReturnOrderInclude(),
  });
}

export async function getReturnOrderList(
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

  const where: Prisma.ReturnOrderWhereInput = {};

  if (keyword) {
    where.OR = [
      { returnNo: { contains: keyword } },
      { inquiry: { inquiryNo: { contains: keyword } } },
      { inquiry: { customerName: { contains: keyword } } },
      { returnReason: { contains: keyword } },
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
    items: true,
    inquiry: { select: { id: true, inquiryNo: true, customerName: true, status: true } },
    createdBy: { select: { realName: true, role: true } },
    identifyBy: { select: { realName: true } },
  };

  const [total, items] = await Promise.all([
    prisma.returnOrder.count({ where }),
    prisma.returnOrder.findMany({
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

export async function addReturnOrderRemark(
  id: string,
  dto: RemarkCreateDto,
  user: JwtPayload,
  req?: Request
) {
  const returnOrder = await prisma.returnOrder.findUnique({ where: { id } });
  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货单不存在');
  }

  const remark = await prisma.remark.create({
    data: {
      content: dto.content,
      isImportant: dto.isImportant,
      createdById: user.userId,
      returnOrderId: id,
    },
    include: {
      createdBy: { select: { realName: true, role: true } },
    },
  });

  await createOperationLog(
    user,
    OperationType.ADD_REMARK,
    {
      inquiryId: returnOrder.inquiryId,
      returnOrderId: id,
      detail: { content: dto.content, isImportant: dto.isImportant },
    },
    req
  );

  return remark;
}

function checkForExceptions(dto: ReturnOrderCreateDto): boolean {
  const totalSubTotal = dto.items.reduce((sum, item) => sum + item.returnQuantity * item.unitPrice, 0);
  if (Math.abs(totalSubTotal - dto.applyRefundAmount) > 0.01) {
    return true;
  }
  for (const item of dto.items) {
    if (item.returnQuantity > item.originalQuantity) {
      return true;
    }
  }
  return false;
}

function detectExceptionType(dto: ReturnOrderCreateDto): string {
  const totalSubTotal = dto.items.reduce((sum, item) => sum + item.returnQuantity * item.unitPrice, 0);
  if (Math.abs(totalSubTotal - dto.applyRefundAmount) > 0.01) {
    return ExceptionType.PRICE_DISPUTE;
  }
  return ExceptionType.OTHER;
}

function getReturnOrderInclude(): any {
  return {
    items: true,
    inquiry: {
      select: {
        id: true,
        inquiryNo: true,
        customerName: true,
        status: true,
        carModel: true,
        vinNo: true,
        stockLock: { select: { id: true, lockNo: true, status: true } },
      },
    },
    createdBy: { select: { id: true, realName: true, role: true } },
    handledBy: { select: { id: true, realName: true, role: true } },
    identifyBy: { select: { id: true, realName: true, role: true } },
    operationLogs: {
      take: 20,
      orderBy: { createdAt: 'desc' as const },
    },
    remarks: {
      include: { createdBy: { select: { realName: true, role: true } } },
      orderBy: [{ isImportant: 'desc' as const }, { createdAt: 'desc' as const }],
    },
    evidences: true,
    refundOrder: {
      select: {
        id: true,
        refundNo: true,
        status: true,
        refundAmount: true,
      },
    },
  } as const;
}

export async function addReturnOrderEvidence(
  id: string,
  dto: EvidenceCreateDto,
  user: JwtPayload,
  req?: Request
) {
  const returnOrder = await prisma.returnOrder.findUnique({ where: { id } });
  if (!returnOrder) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '退货单不存在');
  }

  const evidence = await prisma.evidence.create({
    data: {
      evidenceType: dto.evidenceType,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSize: dto.fileSize,
      description: dto.description,
      uploadedById: user.userId,
      returnOrderId: id,
    },
  });

  await createOperationLog(
    user,
    OperationType.ADD_REMARK,
    {
      inquiryId: returnOrder.inquiryId,
      returnOrderId: id,
      detail: { evidenceType: dto.evidenceType, fileName: dto.fileName },
    },
    req
  );

  return evidence;
}
