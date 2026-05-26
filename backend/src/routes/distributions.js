const express = require('express')
const { authRequired } = require('../middleware/auth')
const { distributions, books, channels, users } = require('../data/store')

const router = express.Router()

function enrich(d) {
  const book = books.find(b => b.id === d.bookId)
  const channel = channels.find(c => c.id === d.channelId)
  return {
    ...d,
    bookTitle: book?.title || '-',
    bookISBN: book?.isbn || '-',
    bookPrice: book?.price || 0,
    authorId: book?.authorId,
    channelName: channel?.name || '-',
    channelType: channel?.type || '-',
    ownerName: users.find(u => u.id === d.ownerId)?.name || '-'
  }
}

function visibleDistributions(user) {
  if (user.role === 'admin' || user.role === 'channel_manager' || user.role === 'finance') {
    return distributions
  }
  if (user.role === 'distribution_specialist') {
    return distributions.filter(d => d.ownerId === user.id)
  }
  return distributions
}

function canEditDistribution(user, d) {
  if (user.role === 'admin' || user.role === 'channel_manager') return true
  if (user.role === 'distribution_specialist') return d.ownerId === user.id
  return false
}

function canSettle(user) {
  return user.role === 'admin' || user.role === 'finance' || user.role === 'channel_manager'
}

function canCreateDistribution(user) {
  return user.role === 'admin' || user.role === 'channel_manager' || user.role === 'distribution_specialist'
}

router.get('/', authRequired, (req, res) => {
  const {
    keyword,
    bookId,
    channelId,
    channelType,
    status,
    sampleReceived,
    ownerId,
    shippedFrom,
    shippedTo
  } = req.query

  let list = visibleDistributions(req.user).map(enrich)
  if (keyword) {
    const kw = keyword.trim()
    list = list.filter(d =>
      d.batch.includes(kw) ||
      d.bookTitle.includes(kw) ||
      d.channelName.includes(kw) ||
      d.sampleExpress.includes(kw)
    )
  }
  if (bookId) list = list.filter(d => d.bookId === bookId)
  if (channelId) list = list.filter(d => d.channelId === channelId)
  if (channelType) list = list.filter(d => d.channelType === channelType)
  if (status) list = list.filter(d => d.status === status)
  if (sampleReceived !== undefined && sampleReceived !== '') {
    const flag = sampleReceived === 'true'
    list = list.filter(d => d.sampleReceived === flag)
  }
  if (ownerId) list = list.filter(d => d.ownerId === ownerId)
  if (shippedFrom) list = list.filter(d => d.shippedAt >= shippedFrom)
  if (shippedTo) list = list.filter(d => d.shippedAt <= shippedTo)

  list.sort((a, b) => (a.shippedAt < b.shippedAt ? 1 : -1))
  res.json({ list, total: list.length })
})

router.get('/:id', authRequired, (req, res) => {
  const d = visibleDistributions(req.user).find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在或无权查看' })
  res.json(enrich(d))
})

router.post('/', authRequired, (req, res) => {
  if (!canCreateDistribution(req.user)) {
    return res.status(403).json({ error: '当前角色无权新建铺货单' })
  }
  const body = req.body || {}
  const maxNum = distributions.reduce((m, d) => {
    const n = parseInt((d.batch || '').split('-').pop() || '0', 10)
    return n > m ? n : m
  }, 0)
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const batchNum = String(maxNum + 1).padStart(3, '0')
  const batch = body.batch || `P${y}-${m}-${batchNum}`

  let ownerId = body.ownerId || req.user.id
  if (req.user.role === 'distribution_specialist') {
    ownerId = req.user.id
  }

  const id = 'd' + (distributions.length + 1)
  const d = {
    id,
    bookId: body.bookId,
    channelId: body.channelId,
    batch,
    qty: Number(body.qty) || 0,
    shippedAt: body.shippedAt || today.toISOString().slice(0, 10),
    sampleExpress: body.sampleExpress || '',
    sampleQty: Number(body.sampleQty) || 0,
    sampleReceived: false,
    sampleReceivedAt: null,
    returnedQty: 0,
    returnedAt: null,
    returnNote: '',
    settledAmount: 0,
    settledAt: null,
    status: '样书待回执',
    ownerId,
    records: [
      {
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        actor: req.user.name,
        action: '新建铺货单',
        note: body.note || `${body.qty || 0} 册，折扣待确认`
      }
    ]
  }
  distributions.unshift(d)
  res.json(enrich(d))
})

router.post('/:id/records', authRequired, (req, res) => {
  const d = visibleDistributions(req.user).find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在或无权查看' })
  if (!canEditDistribution(req.user, d) && req.user.role !== 'finance') {
    return res.status(403).json({ error: '无权追加跟进' })
  }
  const { action, note } = req.body || {}
  d.records.push({
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    actor: req.user.name,
    action: action || '跟进',
    note: note || ''
  })
  res.json(enrich(d))
})

router.patch('/:id/settle', authRequired, (req, res) => {
  const d = visibleDistributions(req.user).find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在或无权查看' })
  if (!canSettle(req.user)) {
    return res.status(403).json({ error: '当前角色无权登记回款' })
  }
  if (d.status === '已回款') {
    return res.status(400).json({ error: '该铺货单已登记回款，请勿重复操作' })
  }
  const body = req.body || {}
  const amount = Number(body.amount)
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '回款金额必须大于 0' })
  }
  const now = new Date()
  const prevStatus = d.status
  d.settledAmount = amount
  d.settledAt = body.date || now.toISOString().slice(0, 10)
  d.status = '已回款'
  d.records.push({
    time: now.toISOString().slice(0, 16).replace('T', ' '),
    actor: req.user.name,
    action: '回款登记',
    note: `金额 ¥${amount}，${prevStatus} → 已回款`
  })
  res.json(enrich(d))
})

router.patch('/:id', authRequired, (req, res) => {
  const d = visibleDistributions(req.user).find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在或无权查看' })
  const body = req.body || {}

  if (body.status === '已回款' && d.status !== '已回款') {
    return res.status(400).json({ error: '请使用「登记回款」功能完成回款登记，不可直接修改状态' })
  }

  if (!canEditDistribution(req.user, d)) {
    return res.status(403).json({ error: '无权修改铺货单' })
  }

  const prevStatus = d.status
  const allowed = { ...body }
  delete allowed.ownerId
  Object.assign(d, allowed)
  if (body.status && body.status !== prevStatus) {
    d.records.push({
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      actor: req.user.name,
      action: '状态变更',
      note: `${prevStatus} → ${body.status}`
    })
  }
  res.json(enrich(d))
})

router.get('/summary/overview', authRequired, (req, res) => {
  const scope = visibleDistributions(req.user)
  const total = scope.length
  const pendingSample = scope.filter(d => !d.sampleReceived).length
  const pendingSettle = scope.filter(d => d.status === '待对账').length
  const returnedQty = scope.reduce((s, d) => s + (d.returnedQty || 0), 0)
  const settled = scope
    .filter(d => d.status === '已回款')
    .reduce((s, d) => s + (d.settledAmount || 0), 0)
  res.json({ total, pendingSample, pendingSettle, returnedQty, settled })
})

module.exports = router
