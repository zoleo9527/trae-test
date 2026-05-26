const express = require('express')
const { requireRoles } = require('../middleware/auth')

const router = express.Router()

router.post('/rejections', requireRoles('STATION_OWNER', 'FINANCE'), async (req, res) => {
  const { entityType, entityId, reason } = req.body

  if (!entityType) return res.status(400).json({ error: '实体类型不能为空' })
  if (!entityId) return res.status(400).json({ error: '实体ID不能为空' })
  if (!reason || reason.trim().length < 2) return res.status(400).json({ error: '驳回原因不能为空且至少2个字' })

  const validTypes = ['COLLECTION_ORDER', 'PRICE_ADJUSTMENT', 'SORTING_RECORD', 'SETTLEMENT']
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ error: `实体类型必须是: ${validTypes.join(', ')}` })
  }

  const note = await req.prisma.rejectionNote.create({
    data: {
      entityType,
      entityId,
      reason: reason.trim(),
      createdById: req.user.id,
    },
    include: {
      createdBy: { select: { id: true, realName: true, role: true } },
    },
  })

  if (entityType === 'COLLECTION_ORDER') {
    await req.prisma.collectionOrder.update({
      where: { id: entityId },
      data: { status: 'REJECTED' },
    }).catch(() => {})
  }

  res.status(201).json({ data: note })
})

router.get('/rejections', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const { entityType, entityId, page = 1, pageSize = 50 } = req.query
  const where = {}
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId

  const [items, total] = await Promise.all([
    req.prisma.rejectionNote.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, realName: true, role: true } } },
    }),
    req.prisma.rejectionNote.count({ where }),
  ])

  res.json({ data: items, total, page: Number(page), pageSize: Number(pageSize) })
})

router.post('/supplemental', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const { entityType, entityId, content } = req.body

  if (!entityType) return res.status(400).json({ error: '实体类型不能为空' })
  if (!entityId) return res.status(400).json({ error: '实体ID不能为空' })
  if (!content || content.trim().length < 1) return res.status(400).json({ error: '补录说明内容不能为空' })

  const validTypes = ['COLLECTION_ORDER', 'PRICE_ADJUSTMENT', 'SORTING_RECORD', 'SETTLEMENT']
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ error: `实体类型必须是: ${validTypes.join(', ')}` })
  }

  const note = await req.prisma.supplementalNote.create({
    data: {
      entityType,
      entityId,
      content: content.trim(),
      createdById: req.user.id,
    },
    include: { createdBy: { select: { id: true, realName: true, role: true } } },
  })

  res.status(201).json({ data: note })
})

router.get('/supplemental', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const { entityType, entityId, page = 1, pageSize = 50 } = req.query
  const where = {}
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId

  const [items, total] = await Promise.all([
    req.prisma.supplementalNote.findMany({
      where,
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, realName: true, role: true } } },
    }),
    req.prisma.supplementalNote.count({ where }),
  ])

  res.json({ data: items, total, page: Number(page), pageSize: Number(pageSize) })
})

router.get('/history/:entityType/:entityId', requireRoles('STATION_OWNER', 'WEIGHER', 'FINANCE'), async (req, res) => {
  const { entityType, entityId } = req.params

  const validTypes = ['COLLECTION_ORDER', 'PRICE_ADJUSTMENT', 'SORTING_RECORD', 'SETTLEMENT']
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({ error: `实体类型必须是: ${validTypes.join(', ')}` })
  }

  const [rejections, supplementals, auditLogs] = await Promise.all([
    req.prisma.rejectionNote.findMany({
      where: { entityType, entityId },
      include: { createdBy: { select: { id: true, realName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    req.prisma.supplementalNote.findMany({
      where: { entityType, entityId },
      include: { createdBy: { select: { id: true, realName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    req.prisma.auditLog.findMany({
      where: { entityType: entityType.toLowerCase(), entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  res.json({
    data: {
      rejections,
      supplementalNotes: supplementals,
      auditLogs,
    },
  })
})

module.exports = router
