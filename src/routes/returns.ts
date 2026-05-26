import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { requireRoles } from '../middleware/rbac';
import { Role, ReturnStatus, BorrowStatus, AuditAction } from '../types';
import { createAuditLog, createNotification } from '../services/audit';

const router = Router();

router.get('/', requireRoles(Role.SHOWROOM_MANAGER, Role.INSTALL_COORDINATOR), async (req: Request, res: Response) => {
  const { status } = req.query;

  const where: any = {};
  if (status) {
    where.status = status as ReturnStatus;
  }

  const returns = await prisma.sampleReturn.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      borrow: {
        include: {
          sample: { select: { name: true, sku: true } },
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  res.json({ code: 0, data: returns });
});

router.post('/:id/inspect-pass', requireRoles(Role.SHOWROOM_MANAGER, Role.INSTALL_COORDINATOR), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, remarks } = req.body;

  const returnRecord = await prisma.sampleReturn.findUnique({
    where: { id },
    include: { borrow: { include: { sample: true, createdBy: true } } },
  });

  if (!returnRecord) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (returnRecord.status !== ReturnStatus.PENDING_INSPECTION && returnRecord.status !== ReturnStatus.NEEDS_REVIEW) {
    return res.status(400).json({ code: 400, message: '当前状态不可验收' });
  }
  if (returnRecord.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updatedReturn = await prisma.sampleReturn.update({
    where: { id },
    data: {
      status: ReturnStatus.INSPECTION_PASSED,
      version: { increment: 1 },
    },
    include: { borrow: { include: { sample: true } } },
  });

  await createAuditLog({
    entityType: 'SampleReturn',
    entityId: id,
    action: AuditAction.INSPECT,
    oldValue: returnRecord,
    newValue: updatedReturn,
    userId: req.user?.userId,
    remark: '验收通过',
  });

  if (returnRecord.borrow.createdById) {
    await createNotification(
      [returnRecord.borrow.createdById],
      '样品归还验收通过',
      `您借出的样品「${returnRecord.borrow.sample.name}」已完成验收`,
      'RETURN_COMPLETED',
      returnRecord.borrowId
    );
  }

  res.json({ code: 0, data: updatedReturn });
});

router.post('/:id/need-review', requireRoles(Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, reason } = req.body;

  const returnRecord = await prisma.sampleReturn.findUnique({
    where: { id },
    include: { borrow: { include: { sample: true, createdBy: true } } },
  });

  if (!returnRecord) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (returnRecord.status !== ReturnStatus.PENDING_INSPECTION) {
    return res.status(400).json({ code: 400, message: '当前状态不可操作' });
  }
  if (returnRecord.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updatedReturn = await prisma.sampleReturn.update({
    where: { id },
    data: {
      status: ReturnStatus.NEEDS_REVIEW,
      reviewReason: reason,
      version: { increment: 1 },
    },
    include: { borrow: { include: { sample: true } } },
  });

  await createAuditLog({
    entityType: 'SampleReturn',
    entityId: id,
    action: AuditAction.INSPECT,
    oldValue: returnRecord,
    newValue: updatedReturn,
    userId: req.user?.userId,
    remark: `需回查：${reason}`,
  });

  const concernedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: returnRecord.borrow.createdById || '' },
        { role: Role.SALES_CONSULTANT },
      ],
    },
    select: { id: true },
  });

  await createNotification(
    concernedUsers.map((u) => u.id),
    '样品归还需回查',
    `样品「${returnRecord.borrow.sample.name}」归还验收需回查：${reason}`,
    'RETURN_NEEDS_REVIEW',
    returnRecord.borrowId
  );

  res.json({ code: 0, data: updatedReturn });
});

router.post('/:id/complete', requireRoles(Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version } = req.body;

  const returnRecord = await prisma.sampleReturn.findUnique({
    where: { id },
    include: { borrow: { include: { sample: true, createdBy: true } } },
  });

  if (!returnRecord) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (returnRecord.status !== ReturnStatus.INSPECTION_PASSED) {
    return res.status(400).json({ code: 400, message: '请先完成验收' });
  }
  if (returnRecord.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updatedReturn = await prisma.sampleReturn.update({
    where: { id },
    data: {
      status: ReturnStatus.COMPLETED,
      version: { increment: 1 },
    },
  });

  await prisma.sampleBorrow.update({
    where: { id: returnRecord.borrowId },
    data: { status: BorrowStatus.COMPLETED, version: { increment: 1 } },
  });

  await prisma.sample.update({
    where: { id: returnRecord.borrow.sampleId },
    data: { status: 'AVAILABLE' },
  });

  await createAuditLog({
    entityType: 'SampleReturn',
    entityId: id,
    action: AuditAction.UPDATE,
    oldValue: returnRecord,
    newValue: updatedReturn,
    userId: req.user?.userId,
    remark: '归还流程完成',
  });

  res.json({ code: 0, data: updatedReturn });
});

export default router;
