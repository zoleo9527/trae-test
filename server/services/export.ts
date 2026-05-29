import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';
import dayjs from 'dayjs';
import prisma from '../utils/prisma';
import { ExportDto } from '../types/dto';
import {
  OperationType,
  JwtPayload,
  ErrorCodes,
  BusinessError,
  InquiryStatusLabel,
  StockLockStatusLabel,
  ReturnStatusLabel,
  RefundStatusLabel,
  ExceptionTypeLabel,
  RoleLabel,
} from '../types';
import { createOperationLog } from './auditLog';
import {
  InquiryStatus,
  StockLockStatus,
  ReturnStatus,
  RefundStatus,
} from '../types/enums';

export async function exportData(
  dto: ExportDto,
  user: JwtPayload,
  res: Response,
  req?: Request
): Promise<void> {
  let data: Record<string, unknown>[] = [];
  let fileName = '';

  switch (dto.type) {
    case 'inquiry':
      data = await exportInquiries(dto);
      fileName = `询价单列表_${dayjs().format('YYYYMMDDHHmmss')}`;
      break;
    case 'stockLock':
      data = await exportStockLocks(dto);
      fileName = `锁库单列表_${dayjs().format('YYYYMMDDHHmmss')}`;
      break;
    case 'returnOrder':
      data = await exportReturnOrders(dto);
      fileName = `退货单列表_${dayjs().format('YYYYMMDDHHmmss')}`;
      break;
    case 'refundOrder':
      data = await exportRefundOrders(dto);
      fileName = `退款单列表_${dayjs().format('YYYYMMDDHHmmss')}`;
      break;
    default:
      throw new BusinessError(ErrorCodes.BAD_REQUEST, '不支持的导出类型');
  }

  await createOperationLog(
    user,
    OperationType.EXPORT,
    {
      detail: { type: dto.type, format: dto.format, recordCount: data.length, filters: dto },
    },
    req
  );

  if (dto.format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
    res.send(buffer);
  } else {
    const parser = new Parser();
    const csv = parser.parse(data);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
    res.send('\uFEFF' + csv);
  }
}

async function exportInquiries(dto: ExportDto): Promise<Record<string, unknown>[]> {
  const where = buildWhereClause(dto);
  const inquiries = await prisma.inquiry.findMany({
    where,
    include: {
      items: true,
      createdBy: { select: { realName: true, role: true } },
      stockLock: { select: { lockNo: true, status: true } },
      returnOrder: { select: { returnNo: true, status: true } },
      refundOrder: { select: { refundNo: true, status: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  });

  return inquiries.map(inq => ({
    '询价单号': inq.inquiryNo,
    '状态': InquiryStatusLabel[inq.status as InquiryStatus] || inq.status,
    '客户名称': inq.customerName,
    '联系电话': inq.customerPhone || '',
    '车型': inq.carModel || '',
    '车架号': inq.vinNo || '',
    '金额': Number(inq.totalAmount),
    '是否加急': inq.isUrgent ? '是' : '否',
    '是否异常': inq.hasException ? '是' : '否',
    '异常类型': inq.exceptionType ? ExceptionTypeLabel[inq.exceptionType as keyof typeof ExceptionTypeLabel] || inq.exceptionType : '',
    '驳回原因': inq.rejectReason || '',
    '补录说明': inq.supplementNote || '',
    '配件清单': inq.items.map(i => `${i.partName} x${i.quantity}`).join('; '),
    '锁库单号': inq.stockLock?.lockNo || '',
    '退货单号': inq.returnOrder?.returnNo || '',
    '退款单号': inq.refundOrder?.refundNo || '',
    '创建人': inq.createdBy.realName,
    '创建时间': dayjs(inq.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  }));
}

async function exportStockLocks(dto: ExportDto): Promise<Record<string, unknown>[]> {
  const where = buildWhereClause(dto);
  const stockLocks = await prisma.stockLock.findMany({
    where,
    include: {
      items: true,
      inquiry: { select: { inquiryNo: true, customerName: true } },
      createdBy: { select: { realName: true, role: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  });

  return stockLocks.map(sl => ({
    '锁库单号': sl.lockNo,
    '状态': StockLockStatusLabel[sl.status as StockLockStatus] || sl.status,
    '关联询价单': sl.inquiry?.inquiryNo || '',
    '客户名称': sl.inquiry?.customerName || '',
    '仓库便签': sl.warehouseNote || '',
    '有效期至': sl.validUntil ? dayjs(sl.validUntil).format('YYYY-MM-DD') : '',
    '配件清单': sl.items.map(i => `${i.partName} x${i.quantity} @ ${i.location || '无库位'}`).join('; '),
    '驳回原因': sl.rejectReason || '',
    '创建人': sl.createdBy.realName,
    '创建时间': dayjs(sl.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  }));
}

async function exportReturnOrders(dto: ExportDto): Promise<Record<string, unknown>[]> {
  const where = buildWhereClause(dto);
  const returnOrders = await prisma.returnOrder.findMany({
    where,
    include: {
      items: true,
      inquiry: { select: { inquiryNo: true, customerName: true } },
      createdBy: { select: { realName: true, role: true } },
      identifyBy: { select: { realName: true } },
      refundOrder: { select: { refundNo: true, status: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  });

  return returnOrders.map(ro => ({
    '退货单号': ro.returnNo,
    '状态': ReturnStatusLabel[ro.status as ReturnStatus] || ro.status,
    '关联询价单': ro.inquiry?.inquiryNo || '',
    '客户名称': ro.inquiry?.customerName || '',
    '退货原因': ro.returnReason,
    '原销售金额': Number(ro.originalAmount),
    '申请退款金额': Number(ro.applyRefundAmount),
    '鉴定结论': ro.identifyResult || '',
    '鉴定人': ro.identifyBy?.realName || '',
    '鉴定时间': ro.identifyDate ? dayjs(ro.identifyDate).format('YYYY-MM-DD HH:mm:ss') : '',
    '是否异常': ro.hasException ? '是' : '否',
    '异常类型': ro.exceptionType ? ExceptionTypeLabel[ro.exceptionType as keyof typeof ExceptionTypeLabel] || ro.exceptionType : '',
    '驳回原因': ro.rejectReason || '',
    '补录要求': ro.reworkNote || '',
    '补录说明': ro.supplementNote || '',
    '退货明细': ro.items.map(i => `${i.partName} x${i.returnQuantity}/${i.originalQuantity}`).join('; '),
    '退款单号': ro.refundOrder?.refundNo || '',
    '创建人': ro.createdBy.realName,
    '创建时间': dayjs(ro.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  }));
}

async function exportRefundOrders(dto: ExportDto): Promise<Record<string, unknown>[]> {
  const where = buildWhereClause(dto);
  const refundOrders = await prisma.refundOrder.findMany({
    where,
    include: {
      returnOrder: { select: { returnNo: true, returnReason: true } },
      inquiry: { select: { inquiryNo: true, customerName: true } },
      createdBy: { select: { realName: true, role: true } },
      reviewBy: { select: { realName: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  });

  return refundOrders.map(ro => ({
    '退款单号': ro.refundNo,
    '状态': RefundStatusLabel[ro.status as RefundStatus] || ro.status,
    '关联退货单': ro.returnOrder?.returnNo || '',
    '关联询价单': ro.inquiry?.inquiryNo || '',
    '客户名称': ro.inquiry?.customerName || '',
    '应退金额': Number(ro.refundAmount),
    '实退金额': ro.actualRefundAmount ? Number(ro.actualRefundAmount) : '',
    '退款方式': ro.paymentMethod || '',
    '打款流水号': ro.paymentTraceNo || '',
    '打款时间': ro.paymentDate ? dayjs(ro.paymentDate).format('YYYY-MM-DD HH:mm:ss') : '',
    '复核结论': ro.reviewResult || '',
    '复核人': ro.reviewBy?.realName || '',
    '复核时间': ro.reviewDate ? dayjs(ro.reviewDate).format('YYYY-MM-DD HH:mm:ss') : '',
    '是否账期客户': ro.isCreditCustomer ? '是' : '否',
    '账期到期日': ro.dueDate ? dayjs(ro.dueDate).format('YYYY-MM-DD') : '',
    '是否拖欠': ro.hasDelay ? '是' : '否',
    '拖欠天数': ro.delayDays || '',
    '是否异常': ro.hasException ? '是' : '否',
    '异常类型': ro.exceptionType ? ExceptionTypeLabel[ro.exceptionType as keyof typeof ExceptionTypeLabel] || ro.exceptionType : '',
    '驳回原因': ro.rejectReason || '',
    '补录说明': ro.supplementNote || '',
    '创建人': ro.createdBy.realName,
    '创建人角色': RoleLabel[ro.createdBy.role as keyof typeof RoleLabel] || ro.createdBy.role,
    '创建时间': dayjs(ro.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  }));
}

function buildWhereClause(dto: ExportDto): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  
  if (dto.status && dto.status.length > 0) {
    where.status = { in: dto.status };
  }
  
  if (dto.startDate) {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dto.startDate) };
  }
  if (dto.endDate) {
    where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(`${dto.endDate}T23:59:59.999Z`) };
  }
  
  if (dto.hasException !== undefined) {
    where.hasException = dto.hasException;
  }
  
  if (dto.keyword) {
    if (dto.type === 'inquiry') {
      where.OR = [
        { inquiryNo: { contains: dto.keyword } },
        { customerName: { contains: dto.keyword } },
      ];
    } else if (dto.type === 'stockLock') {
      where.OR = [
        { lockNo: { contains: dto.keyword } },
        { inquiry: { customerName: { contains: dto.keyword } } },
      ];
    } else if (dto.type === 'returnOrder') {
      where.OR = [
        { returnNo: { contains: dto.keyword } },
        { inquiry: { customerName: { contains: dto.keyword } } },
      ];
    } else {
      where.OR = [
        { refundNo: { contains: dto.keyword } },
        { inquiry: { customerName: { contains: dto.keyword } } },
      ];
    }
  }
  
  return where;
}
