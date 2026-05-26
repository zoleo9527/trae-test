import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { requireRoles } from '../middleware/rbac';
import { Role, BorrowStatus } from '../types';
import { createAuditLog } from '../services/audit';
import { z } from 'zod';

const router = Router();

const sampleSchema = z.object({
  name: z.string().min(1, '样品名称不能为空'),
  sku: z.string().min(1, 'SKU不能为空'),
  category: z.string().min(1, '分类不能为空'),
  description: z.string().optional(),
  location: z.string().min(1, '位置不能为空'),
});

router.get('/', async (req: Request, res: Response) => {
  const { keyword, status, category } = req.query;

  const where: any = {};
  if (keyword) {
    where.OR = [
      { name: { contains: keyword as string } },
      { sku: { contains: keyword as string } },
    ];
  }
  if (status) {
    where.status = status as string;
  }
  if (category) {
    where.category = category as string;
  }

  const samples = await prisma.sample.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      borrowRecords: {
        where: { status: { in: [BorrowStatus.BORROWED, BorrowStatus.APPROVED] } },
        take: 1,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });

  res.json({
    code: 0,
    data: samples,
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const sample = await prisma.sample.findUnique({
    where: { id: req.params.id },
    include: {
      borrowRecords: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { createdBy: { select: { name: true } } },
      },
    },
  });

  if (!sample) {
    return res.status(404).json({ code: 404, message: '样品不存在' });
  }

  res.json({ code: 0, data: sample });
});

router.post('/', requireRoles(Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  try {
    const data = sampleSchema.parse(req.body);

    const existing = await prisma.sample.findUnique({ where: { sku: data.sku } });
    if (existing) {
      return res.status(400).json({ code: 400, message: 'SKU已存在' });
    }

    const sample = await prisma.sample.create({ data });

    await createAuditLog({
      entityType: 'Sample',
      entityId: sample.id,
      action: 'CREATE',
      newValue: sample,
      userId: req.user?.userId,
      remark: '创建样品',
    });

    res.json({ code: 0, data: sample });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ code: 400, message: e.errors[0].message });
    }
    res.status(500).json({ code: 500, message: '创建失败' });
  }
});

router.put('/:id', requireRoles(Role.SHOWROOM_MANAGER), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, ...data } = req.body;

  const existing = await prisma.sample.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ code: 404, message: '样品不存在' });
  }

  if (existing.version !== version) {
    return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
  }

  const updated = await prisma.sample.update({
    where: { id },
    data: { ...data, version: { increment: 1 } },
  });

  await createAuditLog({
    entityType: 'Sample',
    entityId: id,
    action: 'UPDATE',
    oldValue: existing,
    newValue: updated,
    userId: req.user?.userId,
    remark: '更新样品信息',
  });

  res.json({ code: 0, data: updated });
});

export default router;
