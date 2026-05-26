const express = require('express')
const { requireRoles } = require('../middleware/auth')

const router = express.Router()

const DECIMAL_REGEX = /^\d+(\.\d{1,3})?$/

function validateOrderBody(body) {
  const errors = []
  if (!body.supplierName) errors.push('供应商名称不能为空')
  if (!body.materialType) errors.push('物资类型不能为空')
  if (!DECIMAL_REGEX.test(String(body.grossWeight || ''))) errors.push('毛重格式错误')
  if (!DECIMAL_REGEX.test(String(body.tareWeight || ''))) errors.push('皮重格式错误')
  if (!DECIMAL_REGEX.test(String(body.unitPrice || ''))) errors.push('单价格式错误')
  return errors
}

router.get('/', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    materialType,
    supplierName,
    startDate,
    endDate,
    orderNo,
  } = req.query

  const where = {}
  if (status) where.status = status
  if (materialType) where.materialType = { contains: materialType }
  if (supplierName) where.supplierName = { contains: supplierName }
  if (orderNo) where.orderNo = { contains: orderNo }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
  }

  if (req.user.stationId) {
    where.stationId = req.user.stationId
  }

  const [items, total] = await Promise.all([
    req.prisma.collectionOrder.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        station: { select: { id: true, name: true } },
        createdBy: { select: { id: true, realName: true, role: true } },
        weigher: { select: { id: true, realName: true, role: true } },
        sortingRecords: true,
        priceAdjustments: true,
        settlementRecords: true,
        rejectionNotes: true,
        supplementalNotes: true,
      },
    }),
    req.prisma.collectionOrder.count({ where }),
  ])

  res.json({
    data: items,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  })
})

router.get('/:id', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const order = await req.prisma.collectionOrder.findUnique({
    where: { id: req.params.id },
    include: {
      station: { select: { id: true, name: true, address: true } },
      createdBy: { select: { id: true, realName: true, role: true, username: true } },
      weigher: { select: { id: true, realName: true, role: true } },
      sortingRecords: {
        include: { sorter: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      priceAdjustments: {
        include: { approvedBy: { select: { id: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      settlementRecords: {
        include: { settledBy: { select: { id: true, realName: true } } },
        orderBy: { settledAt: 'desc' },
      },
      rejectionNotes: {
        include: { createdBy: { select: { id: true, realName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      supplementalNotes: {
        include: { createdBy: { select: { id: true, realName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) return res.status(404).json({ error: '回收单不存在' })

  if (req.user.stationId && order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权查看其他站点的数据' })
  }

  res.json({ data: order })
})

router.post('/', requireRoles('WEIGHER', 'STATION_OWNER'), async (req, res) => {
  const errors = validateOrderBody(req.body)
  if (errors.length > 0) return res.status(400).json({ error: '参数校验失败', details: errors })

  const { supplierName, supplierPhone, materialType, grossWeight, tareWeight, unitPrice, photos, remarks } = req.body

  const netWeight = Number(grossWeight) - Number(tareWeight)
  if (netWeight <= 0) return res.status(400).json({ error: '净重必须大于零' })

  const totalAmount = Number((netWeight * Number(unitPrice)).toFixed(2))

  const orderNo = `HS${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`

  const order = await req.prisma.collectionOrder.create({
    data: {
      orderNo,
      supplierName,
      supplierPhone: supplierPhone || null,
      materialType,
      grossWeight: Number(grossWeight),
      tareWeight: Number(tareWeight),
      netWeight,
      unitPrice: Number(unitPrice),
      totalAmount,
      status: 'PENDING',
      photos: photos || null,
      remarks: remarks || null,
      stationId: req.user.stationId,
      createdById: req.user.id,
    },
    include: {
      station: { select: { id: true, name: true } },
      createdBy: { select: { id: true, realName: true, role: true } },
    },
  })

  res.status(201).json({ data: order })
})

router.put('/:id', requireRoles('STATION_OWNER', 'WEIGHER'), async (req, res) => {
  const order = await req.prisma.collectionOrder.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: '回收单不存在' })

  if (order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权操作其他站点的数据' })
  }

  if (order.status !== 'PENDING' && order.status !== 'WEIGHED') {
    return res.status(400).json({ error: '当前状态不允许修改', currentStatus: order.status })
  }

  const { grossWeight, tareWeight, unitPrice, ...rest } = req.body
  const data = { ...rest }

  if (grossWeight !== undefined && tareWeight !== undefined) {
    const netWeight = Number(grossWeight) - Number(tareWeight)
    if (netWeight <= 0) return res.status(400).json({ error: '净重必须大于零' })
    data.grossWeight = Number(grossWeight)
    data.tareWeight = Number(tareWeight)
    data.netWeight = netWeight
    const price = unitPrice !== undefined ? Number(unitPrice) : Number(order.unitPrice)
    data.totalAmount = Number((netWeight * price).toFixed(2))
  }
  if (unitPrice !== undefined) {
    data.unitPrice = Number(unitPrice)
    const netWeight = data.netWeight !== undefined ? data.netWeight : Number(order.netWeight)
    data.totalAmount = Number((netWeight * Number(unitPrice)).toFixed(2))
  }

  const updated = await req.prisma.collectionOrder.update({
    where: { id: req.params.id },
    data,
    include: {
      station: { select: { id: true, name: true } },
      createdBy: { select: { id: true, realName: true, role: true } },
    },
  })

  res.json({ data: updated })
})

router.delete('/:id', requireRoles('STATION_OWNER'), async (req, res) => {
  const order = await req.prisma.collectionOrder.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ error: '回收单不存在' })

  if (order.stationId !== req.user.stationId) {
    return res.status(403).json({ error: '无权操作其他站点的数据' })
  }

  if (order.status !== 'PENDING' && order.status !== 'REJECTED') {
    return res.status(400).json({ error: '只有待处理或已驳回的单据可删除', currentStatus: order.status })
  }

  await req.prisma.collectionOrder.delete({ where: { id: req.params.id } })
  res.json({ message: '删除成功' })
})

module.exports = router
