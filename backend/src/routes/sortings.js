const express = require('express')
const { requireRoles } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireRoles('WEIGHER', 'STATION_OWNER'), async (req, res) => {
  const { collectionOrderId, sortedMaterialType, sortedWeight, binLocation, notes } = req.body

  if (!collectionOrderId) return res.status(400).json({ error: '回收单ID不能为空' })
  if (!sortedMaterialType) return res.status(400).json({ error: '分拣后物资类型不能为空' })
  if (!sortedWeight || Number(sortedWeight) <= 0) return res.status(400).json({ error: '分拣重量必须大于零' })

  const order = await req.prisma.collectionOrder.findUnique({ where: { id: collectionOrderId } })
  if (!order) return res.status(404).json({ error: '回收单不存在' })

  if (order.status !== 'PENDING' && order.status !== 'WEIGHED' && order.status !== 'SORTED') {
    return res.status(400).json({ error: '当前状态不允许分拣入库', currentStatus: order.status })
  }

  const existingSortings = await req.prisma.sortingRecord.findMany({
    where: { collectionOrderId },
    select: { sortedWeight: true },
  })
  const totalSorted = existingSortings.reduce((sum, r) => sum + Number(r.sortedWeight), 0)
  if (totalSorted + Number(sortedWeight) > Number(order.netWeight) + 0.001) {
    return res.status(400).json({
      error: '分拣总重量超过回收单净重',
      netWeight: Number(order.netWeight),
      alreadySorted: totalSorted,
      attempted: Number(sortedWeight),
    })
  }

  const record = await req.prisma.$transaction(async (tx) => {
    const r = await tx.sortingRecord.create({
      data: {
        collectionOrderId,
        sortedMaterialType,
        sortedWeight: Number(sortedWeight),
        binLocation: binLocation || null,
        sorterId: req.user.id,
        notes: notes || null,
      },
      include: {
        sorter: { select: { id: true, realName: true } },
        order: { select: { id: true, orderNo: true, status: true } },
      },
    })

    const newTotal = totalSorted + Number(sortedWeight)
    const withinTolerance = newTotal >= Number(order.netWeight) - 0.001
    if (withinTolerance && order.status !== 'SORTED') {
      await tx.collectionOrder.update({
        where: { id: collectionOrderId },
        data: { status: 'SORTED' },
      })
    } else if (order.status === 'PENDING') {
      await tx.collectionOrder.update({
        where: { id: collectionOrderId },
        data: { status: 'WEIGHED', weigherId: req.user.id },
      })
    }

    return r
  })

  res.status(201).json({ data: record })
})

router.get('/', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const { collectionOrderId, page = 1, pageSize = 50 } = req.query
  const where = {}
  if (collectionOrderId) where.collectionOrderId = collectionOrderId

  const [items, total] = await Promise.all([
    req.prisma.sortingRecord.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        sorter: { select: { id: true, realName: true } },
        order: { select: { id: true, orderNo: true, supplierName: true, materialType: true, netWeight: true } },
      },
    }),
    req.prisma.sortingRecord.count({ where }),
  ])

  res.json({ data: items, total, page: Number(page), pageSize: Number(pageSize) })
})

router.get('/:id', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const record = await req.prisma.sortingRecord.findUnique({
    where: { id: req.params.id },
    include: {
      sorter: { select: { id: true, realName: true, role: true } },
      order: { select: { id: true, orderNo: true, supplierName: true, materialType: true, netWeight: true, status: true } },
    },
  })
  if (!record) return res.status(404).json({ error: '分拣记录不存在' })
  res.json({ data: record })
})

module.exports = router
