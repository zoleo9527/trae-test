import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, error, serverError } from '../utils/response';
import { createAuditLog } from '../services/auditLog';
import { LogAction, LogModule } from '@prisma/client';
import { createObjectCsvStringifier } from 'csv-writer';

export async function exportRegistrations(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId, status } = req.query;

    const where: any = {};
    if (activityId) where.activityId = activityId as string;
    if (status) where.status = status as string;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        activity: { select: { title: true, startTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'activityTitle', title: '活动名称' },
        { id: 'userName', title: '姓名' },
        { id: 'userPhone', title: '手机号' },
        { id: 'status', title: '状态' },
        { id: 'isSupplement', title: '是否补录' },
        { id: 'supplementReason', title: '补录原因' },
        { id: 'rejectReason', title: '驳回原因' },
        { id: 'registrationTime', title: '报名时间' },
      ],
    });

    const records = registrations.map((r) => ({
      id: r.id,
      activityTitle: r.activity?.title || '',
      userName: r.userName,
      userPhone: r.userPhone,
      status: r.status,
      isSupplement: r.isSupplement ? '是' : '否',
      supplementReason: r.supplementReason || '',
      rejectReason: r.rejectReason || '',
      registrationTime: r.registrationTime.toISOString(),
    }));

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    await createAuditLog({
      module: LogModule.REGISTRATION,
      action: LogAction.EXPORT,
      recordId: activityId as string || 'all',
      recordType: 'Registration',
      remark: `导出报名数据: ${records.length}条`,
      user: req.user,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function exportCheckIns(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return;

    const { activityId } = req.query;

    const where: any = {};
    if (activityId) where.activityId = activityId as string;

    const checkIns = await prisma.checkInRecord.findMany({
      where,
      include: {
        activity: { select: { title: true } },
        handledBy: { select: { name: true } },
      },
      orderBy: { checkInTime: 'desc' },
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'activityTitle', title: '活动名称' },
        { id: 'userName', title: '姓名' },
        { id: 'userPhone', title: '手机号' },
        { id: 'status', title: '签到状态' },
        { id: 'checkInMethod', title: '签到方式' },
        { id: 'checkInTime', title: '签到时间' },
        { id: 'handledBy', title: '操作人' },
        { id: 'manualRemark', title: '备注' },
      ],
    });

    const records = checkIns.map((c) => ({
      id: c.id,
      activityTitle: c.activity?.title || '',
      userName: c.userName,
      userPhone: c.userPhone,
      status: c.status,
      checkInMethod: c.checkInMethod,
      checkInTime: c.checkInTime?.toISOString() || '',
      handledBy: c.handledBy?.name || '',
      manualRemark: c.manualRemark || '',
    }));

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    await createAuditLog({
      module: LogModule.CHECK_IN,
      action: LogAction.EXPORT,
      recordId: activityId as string || 'all',
      recordType: 'CheckInRecord',
      remark: `导出签到数据: ${records.length}条`,
      user: req.user,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="checkins-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    return serverError(res, err);
  }
}
