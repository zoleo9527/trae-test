const express = require('express')
const { requireRoles } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireRoles('FINANCE', 'STATION_OWNER'), async (req, res) => {
  const { collectionOrderId, amount, paymentMethod, notes } = req.body

  if (!collectionOrderId) return res.status(400).json({ error: '回收单ID不能为空' })
  if (amount === undefined || amount === null) return res.status(400).json({ error: '结算金额不能为空' })
  if (Number(amount) < 0) return res.status(400).json({ error: '结算金额不能为负' })

  const order = await req.prisma.collectionOrder.findUnique({ where: { id: collectionOrderId } })
  if (!order) return res.status(404).json({ error: '回收单不存在' })

  if (order.status === 'PENDING' || order.status === 'REJECTED') {
    return res.status(400).json({ error: '当前状态不允许结算', currentStatus: order.status })
  }

  const existingSettlement = await req.prisma.settlementRecord.findFirst({
    where: { collectionOrderId },
  })
  if (existingSettlement) {
    return res.status(400).json({ error: '该回收单已结算，不可重复结算', settlementId: existingSettlement.id })
  }

  const expectedAmount = Number(order.totalAmount)
  const actualAmount = Number(amount)
  const diff = Math.abs(actualAmount - expectedAmount)

  const settlement = await req.prisma.$transaction(async (tx) => {
    const s = await tx.settlementRecord.create({
      data: {
        collectionOrderId,
        amount: actualAmount,
        settledById: req.user.id,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || null,
      },
      include: {
        settledBy: { select: { id: true, realName: true } },
        order: { select: { id: true, orderNo: true, supplierName: true, totalAmount: true, status: true } },
      },
    })

    await tx.collectionOrder.update({
      where: { id: collectionOrderId },
      data: { status: 'SETTLED' },
    })

    if (diff > 0.001) {
      await tx.supplementalNote.create({
        data: {
          entityType: 'SETTLEMENT',
          entityId: s.id,
          content: `结算金额偏差：应收 ${expectedAmount.toFixed(2)}，实收 ${actualAmount.toFixed(2)}，差额 ${diff > 0 ? '+' : ''}${(actualAmount - expectedAmount).toFixed(2)}。${notes || ''}`,
          createdById: req.user.id,
        },
      })
    }

    return s
  })

  res.status(201).json({
    data: settlement,
    warning: diff > 0.001 ? `结算金额与应收金额偏差 ${(actualAmount - expectedAmount).toFixed(2)} 元` : null,
  })
})

router.get('/', requireRoles('FINANCE', 'STATION_OWNER'), async (req, res) => {
  const {
    collectionOrderId,
    startDate,
    endDate,
    paymentMethod,
    page = 1,
    pageSize = 50,
  } = req.query

  const where = {}
  if (collectionOrderId) where.collectionOrderId = collectionOrderId
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (startDate || endDate) {
    where.settledAt = {}
    if (startDate) where.settledAt.gte = new Date(startDate)
    if (endDate) where.settledAt.lte = new Date(endDate + 'T23:59:59')
  }

  const [items, total] = await Promise.all([
    req.prisma.settlementRecord.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { settledAt: 'desc' },
      include: {
        settledBy: { select: { id: true, realName: true } },
        order: { select: { id: true, orderNo: true, supplierName: true, materialType: true, totalAmount: true } },
      },
    }),
    req.prisma.settlementRecord.count({ where }),
  ])

  let totalAmount = 0
  if (items.length > 0) {
    totalAmount = items.reduce((sum, r) => sum + Number(r.amount), 0)
  }

  res.json({
    data: items,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    summary: { totalAmount },
  })
})

router.get('/:id', requireRoles('FINANCE', 'STATION_OWNER', 'WEIGHER'), async (req, res) => {
  const record = await req.prisma.settlementRecord.findUnique({
    where: { id: req.params.id },
    include: {
      settledBy: { select: { id: true, realName: true, role: true } },
      order: {
        select: {
          id: true, orderNo: true, supplierName: true, materialType: true,
          netWeight: true, unitPrice: true, totalAmount: true, status: true,
          priceAdjustments: true,
          sortingRecords: true,
        },
      },
    },
  })
  if (!record) return res.status(404).json({ error: '结算记录不存在' })

  const supplementalNotes = await req.prisma.supplementalNote.findMany({
    where: { entityType: 'SETTLEMENT', entityId: req.params.id },
    include: { createdBy: { select: { id: true, realName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ data: { ...record, supplementalNotes } })
})

module.exports = router
