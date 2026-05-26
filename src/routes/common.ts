import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { BorrowStatus, ReturnStatus, Role } from '../types';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role as Role;

  const pendingApproval = await prisma.sampleBorrow.count({
    where: { status: BorrowStatus.PENDING_APPROVAL },
  });

  const pendingReturnInspection = await prisma.sampleReturn.count({
    where: { status: ReturnStatus.PENDING_INSPECTION },
  });

  const needsReview = await prisma.sampleReturn.count({
    where: { status: ReturnStatus.NEEDS_REVIEW },
  });

  const rejected = await prisma.sampleBorrow.count({
    where: {
      status: BorrowStatus.REJECTED,
      ...(userRole === Role.SALES_CONSULTANT ? { createdById: userId } : {}),
    },
  });

  const borrowed = await prisma.sampleBorrow.count({
    where: {
      status: BorrowStatus.BORROWED,
    },
  });

  const myPending = await prisma.sampleBorrow.count({
    where: {
      createdById: userId,
      status: { in: [BorrowStatus.PENDING_APPROVAL, BorrowStatus.APPROVED, BorrowStatus.BORROWED] },
    },
  });

  const overdue = await prisma.sampleBorrow.count({
    where: {
      status: { in: [BorrowStatus.BORROWED, BorrowStatus.APPROVED] },
      expectedReturn: { lt: new Date() },
    },
  });

  const latestActivities = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, role: true } } },
  });

  const pendingApprovalList = await prisma.sampleBorrow.findMany({
    where: { status: BorrowStatus.PENDING_APPROVAL },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      sample: { select: { name: true, sku: true } },
      createdBy: { select: { name: true } },
    },
  });

  const pendingInspectionList = await prisma.sampleReturn.findMany({
    where: { status: ReturnStatus.PENDING_INSPECTION },
    take: 5,
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

  const needsReviewList = await prisma.sampleReturn.findMany({
    where: { status: ReturnStatus.NEEDS_REVIEW },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      borrow: {
        include: {
          sample: { select: { name: true, sku: true } },
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  const myRejectedList = await prisma.sampleBorrow.findMany({
    where: {
      status: BorrowStatus.REJECTED,
      ...(userRole === Role.SALES_CONSULTANT ? { createdById: userId } : {}),
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      sample: { select: { name: true, sku: true } },
      approvedBy: { select: { name: true } },
    },
  });

  res.json({
    code: 0,
    data: {
      stats: {
        pendingApproval,
        pendingReturnInspection,
        needsReview,
        rejected,
        borrowed,
        myPending,
        overdue,
      },
      pendingApprovalList,
      pendingInspectionList,
      needsReviewList,
      myRejectedList,
      latestActivities,
    },
  });
});

router.get('/audit-logs', async (req: Request, res: Response) => {
  const { entityType, entityId, page = '1', pageSize = '20' } = req.query;

  const where: any = {};
  if (entityType) where.entityType = entityType as string;
  if (entityId) where.entityId = entityId as string;

  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  const take = parseInt(pageSize as string);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    code: 0,
    data: { list: logs, total, page: parseInt(page as string), pageSize: take },
  });
});

router.get('/notifications', async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { read } = req.query;

  const where: any = { userId };
  if (read !== undefined) {
    where.read = read === 'true';
  }

  const notifications = await prisma.notification.findMany({
    where,
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ code: 0, data: notifications });
});

router.post('/notifications/:id/read', async (req: Request, res: Response) => {
  await prisma.notification.update({
    where: { id: req.params.id, userId: req.user?.userId },
    data: { read: true },
  });
  res.json({ code: 0, message: '已标记为已读' });
});

export default router;
