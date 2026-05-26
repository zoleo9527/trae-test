import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { requireRoles } from '../middleware/rbac';
import { Role, BorrowStatus, AuditAction } from '../types';
import { createAuditLog, createNotification } from '../services/audit';
import { z } from 'zod';

const router = Router();

const createBorrowSchema = z.object({
  sampleId: z.string().min(1, '样品ID不能为空'),
  borrowerName: z.string().min(1, '借用人姓名不能为空'),
  borrowerContact: z.string().min(1, '借用人联系方式不能为空'),
  purpose: z.string().min(1, '借出用途不能为空'),
  expectedReturn: z.string().min(1, '预计归还日期不能为空'),
});

router.get('/', async (req: Request, res: Response) => {
  const { status, my } = req.query;

  const where: any = {};
  if (status) {
    where.status = status as BorrowStatus;
  }
  if (my === 'true' && req.user) {
    where.createdById = req.user.userId;
  }

  const borrows = await prisma.sampleBorrow.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      sample: { select: { name: true, sku: true, location: true } },
      createdBy: { select: { name: true, role: true } },
      approvedBy: { select: { name: true } },
      returnRecord: true,
    },
  });

  res.json({ code: 0, data: borrows });
});

router.get('/:id', async (req: Request, res: Response) => {
  const borrow = await prisma.sampleBorrow.findUnique({
    where: { id: req.params.id },
    include: {
      sample: true,
      createdBy: { select: { name: true, role: true } },
      approvedBy: { select: { name: true } },
      returnRecord: true,
    },
  });

  if (!borrow) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }

  const auditConditions: any[] = [{ entityType: 'SampleBorrow', entityId: req.params.id }];

  if (borrow.returnRecord) {
    auditConditions.push({ entityType: 'SampleReturn', entityId: borrow.returnRecord.id });
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { OR: auditConditions },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  res.json({ code: 0, data: { ...borrow, auditLogs } });
});

router.post('/', requireRoles(Role.SALES_CONSULTANT, Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  try {
    const body = createBorrowSchema.parse(req.body);

    const sample = await prisma.sample.findUnique({ where: { id: body.sampleId } });
    if (!sample) {
      return res.status(404).json({ code: 404, message: '样品不存在' });
    }
    if (sample.status !== 'AVAILABLE') {
      return res.status(400).json({ code: 400, message: '样品当前不可借出' });
    }

    const borrow = await prisma.sampleBorrow.create({
      data: {
        sampleId: body.sampleId,
        borrowerName: body.borrowerName,
        borrowerContact: body.borrowerContact,
        purpose: body.purpose,
        expectedReturn: new Date(body.expectedReturn),
        status: BorrowStatus.PENDING_APPROVAL,
        createdById: req.user?.userId,
      },
      include: { sample: true, createdBy: true },
    });

    await createAuditLog({
      entityType: 'SampleBorrow',
      entityId: borrow.id,
      action: AuditAction.CREATE,
      newValue: borrow,
      userId: req.user?.userId,
      remark: '提交借出申请',
    });

    const managers = await prisma.user.findMany({
      where: { role: Role.SHOWROOM_MANAGER },
      select: { id: true },
    });

    await createNotification(
      managers.map((m) => m.id),
      '新的借出申请待审批',
      `${req.user?.name} 提交了样品「${sample.name}」的借出申请`,
      'BORROW_APPROVAL',
      borrow.id
    );

    res.json({ code: 0, data: borrow });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ code: 400, message: e.errors[0].message });
    }
    res.status(500).json({ code: 500, message: '创建失败' });
  }
});

router.post('/:id/approve', requireRoles(Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version } = req.body;

  const borrow = await prisma.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
  if (!borrow) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (borrow.status !== BorrowStatus.PENDING_APPROVAL) {
    return res.status(400).json({ code: 400, message: '当前状态不可审批' });
  }
  if (borrow.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updated = await prisma.sampleBorrow.update({
    where: { id },
    data: {
      status: BorrowStatus.APPROVED,
      approvedById: req.user?.userId,
      version: { increment: 1 },
    },
    include: { sample: true, createdBy: true },
  });

  await createAuditLog({
    entityType: 'SampleBorrow',
    entityId: id,
    action: AuditAction.APPROVE,
    oldValue: borrow,
    newValue: updated,
    userId: req.user?.userId,
    remark: '审批通过',
  });

  if (borrow.createdById) {
    await createNotification(
      [borrow.createdById],
      '借出申请已通过',
      `您申请的样品「${borrow.sample.name}」已通过审批`,
      'BORROW_APPROVED',
      id
    );
  }

  res.json({ code: 0, data: updated });
});

router.post('/:id/reject', requireRoles(Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, reason } = req.body;

  const borrow = await prisma.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
  if (!borrow) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (borrow.status !== BorrowStatus.PENDING_APPROVAL) {
    return res.status(400).json({ code: 400, message: '当前状态不可驳回' });
  }
  if (borrow.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updated = await prisma.sampleBorrow.update({
    where: { id },
    data: {
      status: BorrowStatus.REJECTED,
      rejectReason: reason,
      version: { increment: 1 },
    },
    include: { sample: true, createdBy: true },
  });

  await createAuditLog({
    entityType: 'SampleBorrow',
    entityId: id,
    action: AuditAction.REJECT,
    oldValue: borrow,
    newValue: updated,
    userId: req.user?.userId,
    remark: `驳回申请：${reason}`,
  });

  if (borrow.createdById) {
    await createNotification(
      [borrow.createdById],
      '借出申请被驳回',
      `您申请的样品「${borrow.sample.name}」被驳回：${reason}`,
      'BORROW_REJECTED',
      id
    );
  }

  res.json({ code: 0, data: updated });
});

router.post('/:id/confirm-borrow', requireRoles(Role.SALES_CONSULTANT, Role.SHOWROOM_MANAGER, Role.INSTALL_COORDINATOR), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version } = req.body;

  const borrow = await prisma.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
  if (!borrow) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (borrow.status !== BorrowStatus.APPROVED) {
    return res.status(400).json({ code: 400, message: '请先完成审批' });
  }
  if (borrow.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updated = await prisma.sampleBorrow.update({
    where: { id },
    data: {
      status: BorrowStatus.BORROWED,
      version: { increment: 1 },
    },
    include: { sample: true, createdBy: true },
  });

  await prisma.sample.update({
    where: { id: borrow.sampleId },
    data: { status: 'BORROWED' },
  });

  await createAuditLog({
    entityType: 'SampleBorrow',
    entityId: id,
    action: AuditAction.BORROW,
    oldValue: borrow,
    newValue: updated,
    userId: req.user?.userId,
    remark: '确认样品已借出',
  });

  res.json({ code: 0, data: updated });
});

router.post('/:id/return', requireRoles(Role.SALES_CONSULTANT, Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, condition, remarks } = req.body;

  const borrow = await prisma.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
  if (!borrow) {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }
  if (borrow.status !== BorrowStatus.BORROWED) {
    return res.status(400).json({ code: 400, message: '当前状态不可归还' });
  }
  if (borrow.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const returnRecord = await prisma.sampleReturn.create({
    data: {
      borrowId: id,
      returnDate: new Date(),
      condition: condition || 'GOOD',
      remarks: remarks || '',
    },
  });

  const updatedBorrow = await prisma.sampleBorrow.update({
    where: { id },
    data: {
      status: BorrowStatus.RETURNING,
      actualReturn: new Date(),
      version: { increment: 1 },
    },
    include: { sample: true, createdBy: true },
  });

  await createAuditLog({
    entityType: 'SampleBorrow',
    entityId: id,
    action: AuditAction.RETURN,
    newValue: { returnRecord, borrow: updatedBorrow },
    userId: req.user?.userId,
    remark: '提交归还，待验收',
  });

  await createAuditLog({
    entityType: 'SampleReturn',
    entityId: returnRecord.id,
    action: AuditAction.RETURN,
    newValue: returnRecord,
    userId: req.user?.userId,
    remark: '提交归还，待验收',
  });

  const managers = await prisma.user.findMany({
    where: { role: Role.SHOWROOM_MANAGER },
    select: { id: true },
  });

  await createNotification(
    managers.map((m) => m.id),
    '样品归还待验收',
    `样品「${borrow.sample.name}」已归还，待验收`,
    'RETURN_INSPECTION',
    id
  );

  res.json({ code: 0, data: { borrow: updatedBorrow, returnRecord } });
});

export default router;
