const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 开始种子数据写入...')

  const hashedPassword = await bcrypt.hash('123456', 10)

  const station = await prisma.station.upsert({
    where: { id: 'station-001' },
    update: {},
    create: {
      id: 'station-001',
      name: '城东回收站',
      address: '北京市朝阳区回收路88号',
    },
  })

  const [owner, weigher, finance] = await Promise.all([
    prisma.user.upsert({
      where: { username: 'boss' },
      update: {},
      create: {
        username: 'boss',
        password: hashedPassword,
        realName: '张老板',
        role: 'STATION_OWNER',
        stationId: station.id,
      },
    }),
    prisma.user.upsert({
      where: { username: 'weigher01' },
      update: {},
      create: {
        username: 'weigher01',
        password: hashedPassword,
        realName: '李过磅',
        role: 'WEIGHER',
        stationId: station.id,
      },
    }),
    prisma.user.upsert({
      where: { username: 'finance01' },
      update: {},
      create: {
        username: 'finance01',
        password: hashedPassword,
        realName: '王财务',
        role: 'FINANCE',
        stationId: station.id,
      },
    }),
  ])

  console.log('✅ 站点与用户创建完成')

  // ========== 正常流 1：完整流转 PENDING → WEIGHED → SORTED → PRICE_ADJUSTED → SETTLED ==========
  const normalOrder1 = await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260001',
      supplierName: '王建军',
      supplierPhone: '13800138001',
      materialType: '废铁',
      grossWeight: 520.5,
      tareWeight: 120.0,
      netWeight: 400.5,
      unitPrice: 2.85,
      totalAmount: 400.5 * 2.85,
      status: 'SETTLED',
      photos: [{ url: 'https://img.example.com/yard-001.jpg', label: '堆场过磅照' }],
      remarks: '老客户，每周一送',
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  await prisma.sortingRecord.create({
    data: {
      collectionOrderId: normalOrder1.id,
      sortedMaterialType: '废铁-纯净',
      sortedWeight: 395.0,
      binLocation: 'A区-01',
      sorterId: weigher.id,
      notes: '分拣出少量杂质，按纯净铁入库',
    },
  })

  await prisma.priceAdjustment.create({
    data: {
      collectionOrderId: normalOrder1.id,
      originalPrice: 2.85,
      adjustedPrice: 2.90,
      reason: '当日市场价格上调，老板确认',
      status: 'APPROVED',
      approvedById: owner.id,
    },
  })

  await prisma.collectionOrder.update({
    where: { id: normalOrder1.id },
    data: { unitPrice: 2.90, totalAmount: Number((400.5 * 2.90).toFixed(2)) },
  })

  await prisma.settlementRecord.create({
    data: {
      collectionOrderId: normalOrder1.id,
      amount: Number((400.5 * 2.90).toFixed(2)),
      settledById: finance.id,
      paymentMethod: 'CASH',
      notes: '现金结清，零头抹去实收1161元',
    },
  })

  console.log('✅ 正常流1完成：回收单 HS202605260001 全流程结算')

  // ========== 正常流 2：分拣入库完成，等待价格调整 ==========
  const normalOrder2 = await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260002',
      supplierName: '刘文华',
      supplierPhone: '13900139002',
      materialType: '废纸箱',
      grossWeight: 300.0,
      tareWeight: 25.0,
      netWeight: 275.0,
      unitPrice: 1.20,
      totalAmount: 275.0 * 1.20,
      status: 'SORTED',
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  await prisma.sortingRecord.createMany({
    data: [
      {
        collectionOrderId: normalOrder2.id,
        sortedMaterialType: '废纸箱-一级',
        sortedWeight: 200.0,
        binLocation: 'B区-03',
        sorterId: weigher.id,
        notes: '一级纸箱，无污渍',
      },
      {
        collectionOrderId: normalOrder2.id,
        sortedMaterialType: '废纸箱-二级',
        sortedWeight: 75.0,
        binLocation: 'B区-05',
        sorterId: weigher.id,
        notes: '部分有胶带，降级处理',
      },
    ],
  })

  console.log('✅ 正常流2完成：回收单 HS202605260002 分拣完成待调价')

  // ========== 正常流 3：刚过磅，等待分拣 ==========
  await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260003',
      supplierName: '陈大勇',
      supplierPhone: '13700137003',
      materialType: '废塑料瓶',
      grossWeight: 180.0,
      tareWeight: 10.0,
      netWeight: 170.0,
      unitPrice: 0.85,
      totalAmount: 170.0 * 0.85,
      status: 'WEIGHED',
      photos: [{ url: 'https://img.example.com/yard-003.jpg', label: '过磅现场' }],
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  console.log('✅ 正常流3完成：回收单 HS202605260003 过磅完成待分拣')

  // ========== 异常流 1：价格调整被驳回 ==========
  const rejectOrder = await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260101',
      supplierName: '赵老四',
      supplierPhone: '13600136004',
      materialType: '废铜',
      grossWeight: 85.0,
      tareWeight: 5.0,
      netWeight: 80.0,
      unitPrice: 42.00,
      totalAmount: 80.0 * 42.00,
      status: 'SORTED',
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  await prisma.sortingRecord.create({
    data: {
      collectionOrderId: rejectOrder.id,
      sortedMaterialType: '废铜-光亮铜',
      sortedWeight: 78.0,
      binLocation: 'C区-02',
      sorterId: weigher.id,
      notes: '分拣出约2kg杂质',
    },
  })

  const rejectedAdj = await prisma.priceAdjustment.create({
    data: {
      collectionOrderId: rejectOrder.id,
      originalPrice: 42.00,
      adjustedPrice: 38.00,
      reason: '铜价下跌，过磅员申请调整',
      status: 'REJECTED',
      approvedById: owner.id,
    },
  })

  await prisma.rejectionNote.create({
    data: {
      entityType: 'PRICE_ADJUSTMENT',
      entityId: rejectedAdj.id,
      reason: '调价幅度太大，先按原价结算，明天再看行情',
      createdById: owner.id,
    },
  })

  console.log('✅ 异常流1完成：回收单 HS202605260101 调价被驳回')

  // ========== 异常流 2：补录说明——过磅时毛重录入错误，事后补录 ==========
  const supplementOrder = await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260102',
      supplierName: '孙美丽',
      supplierPhone: '13500135005',
      materialType: '废铝',
      grossWeight: 150.0,
      tareWeight: 15.0,
      netWeight: 135.0,
      unitPrice: 15.50,
      totalAmount: 135.0 * 15.50,
      status: 'PRICE_ADJUSTED',
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  await prisma.sortingRecord.create({
    data: {
      collectionOrderId: supplementOrder.id,
      sortedMaterialType: '废铝-型材',
      sortedWeight: 135.0,
      binLocation: 'D区-01',
      sorterId: weigher.id,
    },
  })

  await prisma.priceAdjustment.create({
    data: {
      collectionOrderId: supplementOrder.id,
      originalPrice: 15.50,
      adjustedPrice: 15.80,
      reason: '铝价小幅上涨',
      status: 'APPROVED',
      approvedById: owner.id,
    },
  })

  await prisma.collectionOrder.update({
    where: { id: supplementOrder.id },
    data: { unitPrice: 15.80, totalAmount: Number((135.0 * 15.80).toFixed(2)) },
  })

  await prisma.supplementalNote.create({
    data: {
      entityType: 'COLLECTION_ORDER',
      entityId: supplementOrder.id,
      content: '【补录说明】过磅时毛重误录为145kg，实际应为150kg。已通知财务在结算时按净重135kg计算。补录人：李过磅',
      createdById: weigher.id,
    },
  })

  console.log('✅ 异常流2完成：回收单 HS202605260102 毛重录入错误补录说明')

  // ========== 异常流 3：结算金额偏差 + 历史备注 ==========
  const deviationOrder = await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260103',
      supplierName: '周五斤',
      supplierPhone: '13400134006',
      materialType: '废铁',
      grossWeight: 600.0,
      tareWeight: 100.0,
      netWeight: 500.0,
      unitPrice: 2.80,
      totalAmount: 500.0 * 2.80,
      status: 'SETTLED',
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  await prisma.sortingRecord.create({
    data: {
      collectionOrderId: deviationOrder.id,
      sortedMaterialType: '废铁-混合',
      sortedWeight: 500.0,
      binLocation: 'A区-03',
      sorterId: weigher.id,
    },
  })

  const devSettlement = await prisma.settlementRecord.create({
    data: {
      collectionOrderId: deviationOrder.id,
      amount: 1380.00,
      settledById: finance.id,
      paymentMethod: 'CASH',
    },
  })

  await prisma.supplementalNote.create({
    data: {
      entityType: 'SETTLEMENT',
      entityId: devSettlement.id,
      content: '【历史备注】应收1400元，实际结算1380元。差额20元因供应商上次多收了20元，本次扣除。财务确认无误。',
      createdById: finance.id,
    },
  })

  console.log('✅ 异常流3完成：回收单 HS202605260103 结算金额偏差+历史备注')

  // ========== 异常流 4：分拣入库后被站点老板驳回（环保台账补录提醒） ==========
  const envOrder = await prisma.collectionOrder.create({
    data: {
      orderNo: 'HS202605260104',
      supplierName: '吴大锤',
      supplierPhone: '13300133007',
      materialType: '废油漆桶',
      grossWeight: 50.0,
      tareWeight: 5.0,
      netWeight: 45.0,
      unitPrice: 0.50,
      totalAmount: 45.0 * 0.50,
      status: 'SORTED',
      stationId: station.id,
      createdById: weigher.id,
      weigherId: weigher.id,
    },
  })

  await prisma.sortingRecord.create({
    data: {
      collectionOrderId: envOrder.id,
      sortedMaterialType: '废油漆桶-待处理',
      sortedWeight: 45.0,
      binLocation: 'E区-危废暂存',
      sorterId: weigher.id,
      notes: '属于危废，需单独存放',
    },
  })

  await prisma.rejectionNote.create({
    data: {
      entityType: 'COLLECTION_ORDER',
      entityId: envOrder.id,
      reason: '废油漆桶属于危废，环保台账未补录，暂不允许入库结算。请先联系环保局确认处置流程。',
      createdById: owner.id,
    },
  })

  await prisma.supplementalNote.create({
    data: {
      entityType: 'COLLECTION_ORDER',
      entityId: envOrder.id,
      content: '【环保台账提醒】废油漆桶需单独记录危废台账，等待环保局审批后再行处理。老板指示暂存E区。',
      createdById: owner.id,
    },
  })

  console.log('✅ 异常流4完成：回收单 HS202605260104 环保台账问题驳回')

  console.log('\n📊 统计汇总：')
  const counts = await prisma.collectionOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  })
  counts.forEach((c) => console.log(`  ${c.status}: ${c._count.id} 单`))

  console.log('\n🔑 测试账号（密码均为 123456）：')
  console.log('  站点老板: boss / 123456')
  console.log('  过磅员:   weigher01 / 123456')
  console.log('  财务:     finance01 / 123456')

  console.log('\n📦 种子数据写入完成！')
}

seed()
  .catch((e) => {
    console.error('种子数据写入失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
