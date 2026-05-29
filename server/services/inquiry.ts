import { Request } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  InquiryCreateDto,
  InquiryUpdateDto,
  InquiryStatusUpdateDto,
  QueryFilterDto,
  RemarkCreateDto,
} from '../types/dto';
import {
  InquiryStatus,
  OperationType,
  INQUIRY_STATUS_FLOW,
  INQUIRY_TRANSITION_PERMISSIONS,
  ErrorCodes,
  BusinessError,
  JwtPayload,
  calculatePagination,
  PaginatedResult,
  Inquiry as InquiryType,
} from '../types';
import { generateInquiryNo } from '../utils/orderNo';
import { createOperationLog } from './auditLog';

type InquiryWithRelations = any;

function validateStatusTransition(
  currentStatus: string,
  newStatus: InquiryStatus,
  userRole: string
): void {
  const current = currentStatus as InquiryStatus;
  const allowedNext = INQUIRY_STATUS_FLOW[current];
  if (!allowedNext.includes(newStatus)) {
    throw new BusinessError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      `不允许从 [${currentStatus}] 变更为 [${newStatus}]`
    );
  }

  const transitionKey = `${current}->${newStatus}`;
  const allowedRoles = INQUIRY_TRANSITION_PERMISSIONS[transitionKey];
  if (!allowedRoles || !allowedRoles.includes(userRole as never)) {
    throw new BusinessError(
      ErrorCodes.PERMISSION_DENIED,
      `当前角色无权限执行 [${current}]->[${newStatus}] 状态变更`
    );
  }
}

export async function createInquiry(
  dto: InquiryCreateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const idempotencyKey = dto.idempotencyKey || (req as unknown as Record<string, unknown>).idempotencyKey as string;
  const items = dto.items || [];

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quotedPrice || 0) * item.quantity;
  }, 0);

  const inquiry = await prisma.inquiry.create({
    data: {
      inquiryNo: generateInquiryNo(),
      status: InquiryStatus.DRAFT,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      carModel: dto.carModel,
      vinNo: dto.vinNo,
      totalAmount,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
      isUrgent: dto.isUrgent,
      createdById: user.userId,
      idempotencyKey,
      items: items.length > 0 ? {
        create: items.map(item => ({
          partId: item.partId,
          partName: item.partName,
          partCode: item.partCode,
          quantity: item.quantity,
          quotedPrice: item.quotedPrice,
          remark: item.remark,
        })),
      } : undefined,
    },
    include: getInquiryInclude(),
  });

  await createOperationLog(
    user,
    OperationType.CREATE,
    {
      inquiryId: inquiry.id,
      newStatus: inquiry.status,
      detail: { customerName: dto.customerName, itemCount: items.length },
    },
    req
  );

  return inquiry;
}

export async function updateInquiry(
  id: string,
  dto: InquiryUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '询价单不存在');
  }

  if (inquiry.status !== InquiryStatus.DRAFT && inquiry.status !== InquiryStatus.PENDING) {
    throw new BusinessError(ErrorCodes.PERMISSION_DENIED, '只能编辑草稿或待报价状态的询价单');
  }

  const updateData: any = {
    handledById: user.userId,
  };

  if (dto.customerName !== undefined) updateData.customerName = dto.customerName;
  if (dto.customerPhone !== undefined) updateData.customerPhone = dto.customerPhone;
  if (dto.carModel !== undefined) updateData.carModel = dto.carModel;
  if (dto.vinNo !== undefined) updateData.vinNo = dto.vinNo;
  if (dto.expectedDate !== undefined) updateData.expectedDate = new Date(dto.expectedDate);
  if (dto.isUrgent !== undefined) updateData.isUrgent = dto.isUrgent;
  if (dto.rejectReason !== undefined) updateData.rejectReason = dto.rejectReason;
  if (dto.supplementNote !== undefined) updateData.supplementNote = dto.supplementNote;
  if (dto.hasException !== undefined) updateData.hasException = dto.hasException;
  if (dto.exceptionType !== undefined) updateData.exceptionType = dto.exceptionType;
  if (dto.exceptionNote !== undefined) updateData.exceptionNote = dto.exceptionNote;

  if (dto.items) {
    const totalAmount = dto.items.reduce((sum, item) => {
      return sum + (item.quotedPrice || 0) * item.quantity;
    }, 0);
    updateData.totalAmount = totalAmount;
    updateData.items = {
      deleteMany: {},
      create: dto.items.map(item => ({
        partId: item.partId,
        partName: item.partName,
        partCode: item.partCode,
        quantity: item.quantity,
        quotedPrice: item.quotedPrice,
        remark: item.remark,
      })),
    };
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: updateData,
    include: getInquiryInclude(),
  });

  await createOperationLog(
    user,
    OperationType.UPDATE,
    {
      inquiryId: id,
      oldStatus: inquiry.status,
      newStatus: updated.status,
      detail: { updatedFields: Object.keys(dto) },
    },
    req
  );

  return updated;
}

export async function updateInquiryStatus(
  id: string,
  dto: InquiryStatusUpdateDto,
  user: JwtPayload,
  req?: Request
): Promise<any> {
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '询价单不存在');
  }

  validateStatusTransition(inquiry.status, dto.status, user.role);

  const updateData: any = {
    status: dto.status,
    handledById: user.userId,
  };

  if (dto.rejectReason) updateData.rejectReason = dto.rejectReason;

  const updated = await prisma.inquiry.update({
    where: { id },
    data: updateData,
    include: getInquiryInclude(),
  });

  const operationType = dto.status === InquiryStatus.CANCELLED
    ? OperationType.CANCEL
    : dto.status === InquiryStatus.CONFIRMED || dto.status === InquiryStatus.COMPLETED
    ? OperationType.APPROVE
    : OperationType.UPDATE;

  await createOperationLog(
    user,
    operationType,
    {
      inquiryId: id,
      oldStatus: inquiry.status,
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
        inquiryId: id,
      },
    });
  }

  return updated;
}

export async function getInquiry(id: string): Promise<any> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: getInquiryInclude(),
  });

  if (!inquiry) {
    throw new BusinessError(ErrorCodes.NOT_FOUND, '询价单不存在');
  }

  return inquiry;
}

export async function getInquiryList(
  filters: QueryFilterDto,
  user: JwtPayload
): Promise<PaginatedResult<InquiryType>> {
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

  const where: Prisma.InquiryWhereInput = {};

  if (keyword) {
    where.OR = [
      { inquiryNo: { contains: keyword } },
      { customerName: { contains: keyword } },
      { carModel: { contains: keyword } },
      { vinNo: { contains: keyword } },
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

  const [total, items] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        items: true,
        createdBy: { select: { realName: true, role: true } },
        stockLock: { select: { id: true, lockNo: true, status: true } },
        returnOrder: { select: { id: true, returnNo: true, status: true } },
        refundOrder: { select: { id: true, refundNo: true, status: true } },
      },
    }),
  ]);

  const pagination = calculatePagination(total, page, pageSize);
  return { items, pagination };
}

export async function addInquiryRemark(
  id: string,
  dto: RemarkCreateDto,
  user: JwtPayload,
  req?: Request
) {
  const remark = await prisma.remark.create({
    data: {
      content: dto.content,
      isImportant: dto.isImportant,
      createdById: user.userId,
      inquiryId: id,
    },
    include: {
      createdBy: { select: { realName: true, role: true } },
    },
  });

  await createOperationLog(
    user,
    OperationType.ADD_REMARK,
    {
      inquiryId: id,
      detail: { content: dto.content, isImportant: dto.isImportant },
    },
    req
  );

  return remark;
}

function getInquiryInclude(): any {
  return {
    items: true,
    createdBy: { select: { id: true, realName: true, role: true } },
    handledBy: { select: { id: true, realName: true, role: true } },
    stockLock: {
      include: {
        items: true,
        createdBy: { select: { realName: true } },
      },
    },
    returnOrder: {
      include: {
        items: true,
        createdBy: { select: { realName: true } },
        identifyBy: { select: { realName: true } },
      },
    },
    refundOrder: {
      include: {
        createdBy: { select: { realName: true } },
        reviewBy: { select: { realName: true } },
      },
    },
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
