import { Request } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  StockLockCreateDto,
  StockLockUpdateDto,
  StockLockStatusUpdateDto,
  QueryFilterDto,
  RemarkCreateDto,
} from '../types/dto';
import {
  StockLockStatus,
  OperationType,
  STOCK_LOCK_STATUS_FLOW,
  STOCK_LOCK_TRANSITION_PERMISSIONS,
  ErrorCodes,
  BusinessError,
  JwtPayload,
  calculatePagination,
  PaginatedResult,
} from '../types';
import { generateStockLockNo } from '../utils/orderNo';
import { createOperationLog } from './auditLog';

type StockLockWithRelations = any;

function validateStatusTransition(
  currentStatus: string,
  newStatus: StockLockStatus,
  userRole: string
): void {
  const current = currentStatus as StockLockStatus;
  const allowedNext = STOCK_LOCK_STATUS_FLOW[current];
  if (!allowedNext.includes(newStatus)) {
    throw new BusinessError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      `不允许从 [${currentStatus}] 变更为 [${newStatus}]`
    );
  }

  const transitionKey = `${current}->${newStatus}`;
  const allowedRoles = STOCK_LOCK_TRANSITION_PERMISSIONS[transitionKey];
  if (!allowedRoles || !allowedRoles.includes(userRole as never)) {
    throw new BusinessError(
      ErrorCodes.PERMISSION_DENIED,
      `当前角色无权限执行 [${current}]->[${newStatus}] 状态变更`
    );
  }
}

export async function createStockLock(
  dto: StockLockCreateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: dto.inquiryId },
    include: { stockLock: true },
  });

  if (!inquiry) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '关联询价单不存在');
  }

  if (inquiry.stockLock) {
    throw new BusinessError(ErrorCodes.DUPLICATE_ERROR, '该询价单已创建锁库单');
  }

  const idempotencyKey = dto.idempotencyKey || (req as unknown as Record<string, unknown>).idempotencyKey as string;

  const stockLock = await prisma.stockLock.create({
    data: {
      lockNo: generateStockLockNo(),
      inquiryId: dto.inquiryId,
      status: StockLockStatus.PENDING,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      warehouseNote: dto.warehouseNote,
      createdById: user.userId,
      idempotencyKey,
      items: {
        create: dto.items.map(item => ({
          partId: item.partId,
          partName: item.partName,
          partCode: item.partCode,
          quantity: item.quantity,
          location: item.location,
        })),
      },
    },
    include: getStockLockInclude(),
  });

  await createOperationLog(
    user,
    OperationType.CREATE,
    {
      inquiryId: dto.inquiryId,
      stockLockId: stockLock.id,
      newStatus: stockLock.status,
      detail: { itemCount: dto.items.length, warehouseNote: dto.warehouseNote },
    },
    req
  );

  return stockLock;
}

export async function updateStockLock(
  id: string,
  dto: StockLockUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const stockLock = await prisma.stockLock.findUnique({ where: { id } });
  if (!stockLock) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '锁库单不存在');
  }

  if (stockLock.status !== StockLockStatus.PENDING) {
    throw new BusinessError(ErrorCodes.PERMISSION_DENIED, '只能编辑待确认状态的锁库单');
  }

  const updateData: any = {
    handledById: user.userId,
  };

  if (dto.validUntil !== undefined) updateData.validUntil = new Date(dto.validUntil);
  if (dto.warehouseNote !== undefined) updateData.warehouseNote = dto.warehouseNote;
  if (dto.rejectReason !== undefined) updateData.rejectReason = dto.rejectReason;

  if (dto.items) {
    updateData.items = {
      deleteMany: {},
      create: dto.items.map(item => ({
        partId: item.partId,
        partName: item.partName,
        partCode: item.partCode,
        quantity: item.quantity,
        location: item.location,
      })),
    };
  }

  const updated = await prisma.stockLock.update({
    where: { id },
    data: updateData,
    include: getStockLockInclude(),
  });

  await createOperationLog(
    user,
    OperationType.UPDATE,
    {
      inquiryId: stockLock.inquiryId,
      stockLockId: id,
      oldStatus: stockLock.status,
      newStatus: updated.status,
      detail: { updatedFields: Object.keys(dto) },
    },
    req
  );

  return updated;
}

export async function updateStockLockStatus(
  id: string,
  dto: StockLockStatusUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const stockLock = await prisma.stockLock.findUnique({ where: { id } });
  if (!stockLock) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '锁库单不存在');
  }

  validateStatusTransition(stockLock.status, dto.status, user.role);

  const updateData: any = {
    status: dto.status,
    handledById: user.userId,
  };

  if (dto.rejectReason) updateData.rejectReason = dto.rejectReason;

  if (dto.status === StockLockStatus.LOCKED) {
    updateData.items = {
      updateMany: {
        where: {},
        data: {
          checked: true,
          checkedAt: new Date(),
          checkedById: user.userId,
        },
      },
    };
  }

  const updated = await prisma.stockLock.update({
    where: { id },
    data: updateData,
    include: getStockLockInclude(),
  });

  const operationType = dto.status === StockLockStatus.LOCKED
    ? OperationType.LOCK
    : dto.status === StockLockStatus.RELEASED
    ? OperationType.UNLOCK
    : dto.status === StockLockStatus.SOLD
    ? OperationType.INSPECT
    : OperationType.UPDATE;

  await createOperationLog(
    user,
    operationType,
    {
      inquiryId: stockLock.inquiryId,
      stockLockId: id,
      oldStatus: stockLock.status,
      newStatus: dto.status,
      detail: { reason: dto.rejectReason, remark: dto.remark },
    },
    req
  );

  if (dto.remark) {
    await prisma.remark.create({
      data: {
        content: dto.remark,
        createdById: user.userId,
        stockLockId: id,
      },
    });
  }

  return updated;
}

export async function getStockLock(id: string): Promise<any> {
  const stockLock = await prisma.stockLock.findUnique({
    where: { id },
    include: getStockLockInclude(),
  });

  if (!stockLock) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '锁库单不存在');
  }

  return stockLock;
}

export async function getStockLockByInquiry(inquiryId: string): Promise<StockLockWithRelations | null> {
  return prisma.stockLock.findUnique({
    where: { inquiryId },
    include: getStockLockInclude(),
  });
}

export async function getStockLockList(
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

  const where: Prisma.StockLockWhereInput = {};

  if (keyword) {
    where.OR = [
      { lockNo: { contains: keyword } },
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
    where.inquiry = { hasException };
  }

  const include = {
    items: true,
    inquiry: { select: { id: true, inquiryNo: true, customerName: true, status: true } },
    createdBy: { select: { realName: true, role: true } },
  };

  const [total, items] = await Promise.all([
    prisma.stockLock.count({ where }),
    prisma.stockLock.findMany({
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

export async function addStockLockRemark(
  id: string,
  dto: RemarkCreateDto,
  user: JwtPayload,
  req?: Request
) {
  const stockLock = await prisma.stockLock.findUnique({ where: { id } });
  if (!stockLock) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '锁库单不存在');
  }

  const remark = await prisma.remark.create({
    data: {
      content: dto.content,
      isImportant: dto.isImportant,
      createdById: user.userId,
      stockLockId: id,
    },
    include: {
      createdBy: { select: { realName: true, role: true } },
    },
  });

  await createOperationLog(
    user,
    OperationType.ADD_REMARK,
    {
      inquiryId: stockLock.inquiryId,
      stockLockId: id,
      detail: { content: dto.content, isImportant: dto.isImportant },
    },
    req
  );

  return remark;
}

function getStockLockInclude(): any {
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
      },
    },
    createdBy: { select: { id: true, realName: true, role: true } },
    handledBy: { select: { id: true, realName: true, role: true } },
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
