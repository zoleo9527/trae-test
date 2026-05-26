const express = require('express')
const { requireRoles } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireRoles('STATION_OWNER', 'WEIGHER'), async (req, res) => {
  const { collectionOrderId, adjustedPrice, reason } = req.body

  if (!collectionOrderId) return res.status(400).json({ error: '回收单ID不能为空' })
  if (!adjustedPrice || Number(adjustedPrice) < 0) return res.status(400).json({ error: '调整后价格必须非负' })
  if (!reason || reason.trim().length < 2) return res.status(400).json({ error: '调整原因不能为空且至少2个字' })

  const order = await req.prisma.collectionOrder.findUnique({
    where: { id: collectionOrderId },
    include: { station: true },
  })
  if (!order) return res.status(404).json({ error: '回收单不存在' })

  if (order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权操作其他站点的数据' })
  }

  if (order.status === 'SETTLED') {
    return res.status(400).json({ error: '已结算的单据不允许调整价格' })
  }
  if (order.status === 'REJECTED') {
    return res.status(400).json({ error: '已驳回的单据不允许调整价格' })
  }
  if (order.status === 'PENDING' || order.status === 'WEIGHED') {
    return res.status(400).json({ error: '分拣入库完成后才能调整价格，当前状态：' + order.status })
  }

  const originalPrice = Number(order.unitPrice)
  const adjusted = Number(adjustedPrice)

  const adjustment = await req.prisma.$transaction(async (tx) => {
    const adj = await tx.priceAdjustment.create({
      data: {
        collectionOrderId,
        originalPrice,
        adjustedPrice: adjusted,
        reason: reason.trim(),
        status: req.user.role === 'STATION_OWNER' ? 'APPROVED' : 'PENDING',
        approvedById: req.user.role === 'STATION_OWNER' ? req.user.id : null,
      },
      include: {
        order: { select: { id: true, orderNo: true, netWeight: true, status: true } },
      },
    })

    if (req.user.role === 'STATION_OWNER') {
      const newTotal = Number((Number(order.netWeight) * adjusted).toFixed(2))
      await tx.collectionOrder.update({
        where: { id: collectionOrderId },
        data: {
          unitPrice: adjusted,
          totalAmount: newTotal,
          status: 'PRICE_ADJUSTED',
        },
      })
    }

    return adj
  })

  res.status(201).json({
    data: adjustment,
    needsApproval: req.user.role !== 'STATION_OWNER',
  })
})

router.post('/:id/approve', requireRoles('STATION_OWNER'), async (req, res) => {
  const adjustment = await req.prisma.priceAdjustment.findUnique({
    where: { id: req.params.id },
    include: { order: true },
  })
  if (!adjustment) return res.status(404).json({ error: '价格调整记录不存在' })

  if (adjustment.order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权操作其他站点的数据' })
  }

  if (adjustment.status !== 'PENDING') {
    return res.status(400).json({ error: '当前状态不允许审批', currentStatus: adjustment.status })
  }

  const updated = await req.prisma.$transaction(async (tx) => {
    const adj = await tx.priceAdjustment.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
      },
      include: {
        order: { select: { id: true, orderNo: true } },
        approvedBy: { select: { id: true, realName: true } },
      },
    })

    const newTotal = Number((Number(adjustment.order.netWeight) * Number(adjustment.adjustedPrice)).toFixed(2))
    await tx.collectionOrder.update({
      where: { id: adjustment.collectionOrderId },
      data: {
        unitPrice: Number(adjustment.adjustedPrice),
        totalAmount: newTotal,
        status: 'PRICE_ADJUSTED',
      },
    })

    return adj
  })

  res.json({ data: updated })
})

router.post('/:id/reject', requireRoles('STATION_OWNER'), async (req, res) => {
  const { reason } = req.body
  if (!reason || reason.trim().length < 2) return res.status(400).json({ error: '驳回原因不能为空' })

  const adjustment = await req.prisma.priceAdjustment.findUnique({
    where: { id: req.params.id },
    include: { order: true },
  })
  if (!adjustment) return res.status(404).json({ error: '价格调整记录不存在' })

  if (adjustment.order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权操作其他站点的数据' })
  }

  if (adjustment.status !== 'PENDING') {
    return res.status(400).json({ error: '当前状态不允许驳回', currentStatus: adjustment.status })
  }

  const updated = await req.prisma.$transaction(async (tx) => {
    const adj = await tx.priceAdjustment.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', approvedById: req.user.id },
      include: { approvedBy: { select: { id: true, realName: true } } },
    })

    await tx.rejectionNote.create({
      data: {
        entityType: 'PRICE_ADJUSTMENT',
        entityId: req.params.id,
        reason: reason.trim(),
        createdById: req.user.id,
      },
    })

    return adj
  })

  res.json({ data: updated })
})

router.get('/', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const { collectionOrderId, status, page = 1, pageSize = 50 } = req.query
  const where = {}
  if (collectionOrderId) where.collectionOrderId = collectionOrderId
  if (status) where.status = status

  if (req.user.stationId) {
    where.order = { stationId: req.user.stationId }
  }

  const [items, total] = await Promise.all([
    req.prisma.priceAdjustment.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNo: true, supplierName: true, netWeight: true, stationId: true } },
        approvedBy: { select: { id: true, realName: true } },
      },
    }),
    req.prisma.priceAdjustment.count({ where }),
  ])

  res.json({ data: items, total, page: Number(page), pageSize: Number(pageSize) })
})

router.get('/:id', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const adj = await req.prisma.priceAdjustment.findUnique({
    where: { id: req.params.id },
    include: {
      order: { select: { id: true, orderNo: true, supplierName: true, netWeight: true, status: true, stationId: true } },
      approvedBy: { select: { id: true, realName: true, role: true } },
    },
  })
  if (!adj) return res.status(404).json({ error: '价格调整记录不存在' })

  if (req.user.stationId && adj.order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权查看其他站点的数据' })
  }

  res.json({ data: adj })
})

module.exports = router
