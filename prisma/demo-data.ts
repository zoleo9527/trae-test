import { PrismaClient } from '@prisma/client';
import { BorrowStatus, ReturnStatus, Role } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  const [manager, sales1, sales2, install] = await Promise.all([
    prisma.user.findUnique({ where: { username: 'manager' } }),
    prisma.user.findUnique({ where: { username: 'sales1' } }),
    prisma.user.findUnique({ where: { username: 'sales2' } }),
    prisma.user.findUnique({ where: { username: 'install' } }),
  ]);

  if (!manager || !sales1 || !sales2 || !install) {
    console.log('请先运行 npm run seed 初始化基础数据');
    return;
  }

  const samples = await prisma.sample.findMany({ take: 6 });
  if (samples.length < 6) {
    console.log('样品数据不足');
    return;
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const nearFuture = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  console.log('清理旧的演示数据...');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.sampleReturn.deleteMany({});
  await prisma.sampleBorrow.deleteMany({});
  await prisma.sample.updateMany({ data: { status: 'AVAILABLE' } });

  console.log('创建演示数据...');

  const borrow1 = await prisma.sampleBorrow.create({
    data: {
      sampleId: samples[0].id,
      borrowerName: '陈先生',
      borrowerContact: '13800138001',
      purpose: '客户家中摆放看效果',
      expectedReturn: nearFuture,
      status: BorrowStatus.PENDING_APPROVAL,
      createdById: sales1.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow1.id,
      action: 'CREATE',
      newValue: JSON.stringify(borrow1),
      remark: '提交借出申请',
      userId: sales1.id,
    },
  });

  const borrow2 = await prisma.sampleBorrow.create({
    data: {
      sampleId: samples[1].id,
      borrowerName: '刘女士',
      borrowerContact: '13800138002',
      purpose: '展厅活动展示',
      expectedReturn: futureDate,
      status: BorrowStatus.REJECTED,
      createdById: sales2.id,
      approvedById: manager.id,
      rejectReason: '该样品本周末有客户预约看样，无法借出',
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow2.id,
      action: 'CREATE',
      newValue: JSON.stringify(borrow2),
      remark: '提交借出申请',
      userId: sales2.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow2.id,
      action: 'REJECT',
      remark: '驳回：该样品本周末有客户预约看样，无法借出',
      userId: manager.id,
    },
  });

  const borrow3 = await prisma.sampleBorrow.create({
    data: {
      sampleId: samples[2].id,
      borrowerName: '周先生',
      borrowerContact: '13800138003',
      purpose: '新房装修搭配参考',
      expectedReturn: pastDate,
      status: BorrowStatus.BORROWED,
      createdById: sales1.id,
      approvedById: manager.id,
    },
  });
  await prisma.sample.update({
    where: { id: samples[2].id },
    data: { status: 'BORROWED' },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow3.id,
      action: 'CREATE',
      newValue: JSON.stringify(borrow3),
      remark: '提交借出申请',
      userId: sales1.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow3.id,
      action: 'APPROVE',
      remark: '审批通过',
      userId: manager.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow3.id,
      action: 'BORROW',
      remark: '确认样品已借出',
      userId: sales1.id,
    },
  });

  const borrow4 = await prisma.sampleBorrow.create({
    data: {
      sampleId: samples[3].id,
      borrowerName: '吴女士',
      borrowerContact: '13800138004',
      purpose: '摄影棚拍摄',
      expectedReturn: futureDate,
      status: BorrowStatus.BORROWED,
      createdById: sales2.id,
      approvedById: manager.id,
    },
  });
  await prisma.sample.update({
    where: { id: samples[3].id },
    data: { status: 'BORROWED' },
  });

  const borrow5 = await prisma.sampleBorrow.create({
    data: {
      sampleId: samples[4].id,
      borrowerName: '郑先生',
      borrowerContact: '13800138005',
      purpose: '客户现场体验',
      expectedReturn: futureDate,
      status: BorrowStatus.RETURNING,
      createdById: sales1.id,
      approvedById: manager.id,
      actualReturn: now,
    },
  });
  const return1 = await prisma.sampleReturn.create({
    data: {
      borrowId: borrow5.id,
      returnDate: now,
      condition: 'GOOD',
      status: ReturnStatus.PENDING_INSPECTION,
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleBorrow',
      entityId: borrow5.id,
      action: 'RETURN',
      remark: '提交归还，待验收',
      userId: sales1.id,
    },
  });

  const borrow6 = await prisma.sampleBorrow.create({
    data: {
      sampleId: samples[5].id,
      borrowerName: '孙女士',
      borrowerContact: '13800138006',
      purpose: '展会展示',
      expectedReturn: pastDate,
      status: BorrowStatus.RETURNING,
      createdById: sales2.id,
      approvedById: manager.id,
      actualReturn: now,
    },
  });
  const return2 = await prisma.sampleReturn.create({
    data: {
      borrowId: borrow6.id,
      returnDate: now,
      condition: 'DAMAGED',
      remarks: '表面有轻微划痕',
      status: ReturnStatus.NEEDS_REVIEW,
      reviewReason: '表面有轻微划痕，需确认是借出前已有还是借出期间造成，涉及赔偿问题需销售与客户确认',
    },
  });
  await prisma.auditLog.create({
    data: {
      entityType: 'SampleReturn',
      entityId: return2.id,
      action: 'INSPECT',
      remark: '需回查：表面有轻微划痕，需确认是借出前已有还是借出期间造成，涉及赔偿问题需销售与客户确认',
      userId: manager.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        title: '新的借出申请待审批',
        content: `${sales1.name} 提交了样品「${samples[0].name}」的借出申请`,
        type: 'BORROW_APPROVAL',
        relatedId: borrow1.id,
      },
      {
        userId: manager.id,
        title: '样品归还待验收',
        content: `样品「${samples[4].name}」已归还，待验收`,
        type: 'RETURN_INSPECTION',
        relatedId: borrow5.id,
      },
      {
        userId: sales1.id,
        title: '借出申请被驳回',
        content: `您申请的样品「${samples[1].name}」被驳回：该样品本周末有客户预约看样，无法借出`,
        type: 'BORROW_REJECTED',
        relatedId: borrow2.id,
        read: true,
      },
      {
        userId: sales1.id,
        title: '借出申请已通过',
        content: `您申请的样品「${samples[2].name}」已通过审批`,
        type: 'BORROW_APPROVED',
        relatedId: borrow3.id,
        read: true,
      },
      {
        userId: sales2.id,
        title: '样品归还需回查',
        content: `样品「${samples[5].name}」归还验收需回查：表面有轻微划痕，需确认是借出前已有还是借出期间造成，涉及赔偿问题需销售与客户确认`,
        type: 'RETURN_NEEDS_REVIEW',
        relatedId: borrow6.id,
      },
      {
        userId: sales1.id,
        title: '样品归还需回查',
        content: `样品「${samples[5].name}」归还验收需回查：表面有轻微划痕，需确认是借出前已有还是借出期间造成，涉及赔偿问题需销售与客户确认`,
        type: 'RETURN_NEEDS_REVIEW',
        relatedId: borrow6.id,
      },
    ],
  });

  console.log('✅ 演示数据创建完成！');
  console.log('');
  console.log('📊 数据概览：');
  console.log('  • 待审批：1 条');
  console.log('  • 待验收：1 条');
  console.log('  • 需回查：1 条');
  console.log('  • 已驳回：1 条');
  console.log('  • 借出中：2 条（含1条已超时）');
  console.log('  • 通知：6 条');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
