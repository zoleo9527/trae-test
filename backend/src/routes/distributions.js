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

  let list = distributions.map(enrich)
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
  const d = distributions.find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在' })
  res.json(enrich(d))
})

router.post('/:id/records', authRequired, (req, res) => {
  const d = distributions.find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在' })
  const { action, note } = req.body || {}
  d.records.push({
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    actor: req.user.name,
    action: action || '跟进',
    note: note || ''
  })
  res.json(enrich(d))
})

router.patch('/:id', authRequired, (req, res) => {
  const d = distributions.find(x => x.id === req.params.id)
  if (!d) return res.status(404).json({ error: '铺货单不存在' })
  const body = req.body || {}
  const prevStatus = d.status
  Object.assign(d, body)
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
  const total = distributions.length
  const pendingSample = distributions.filter(d => !d.sampleReceived).length
  const pendingSettle = distributions.filter(d => d.status === '待对账').length
  const returnedQty = distributions.reduce((s, d) => s + (d.returnedQty || 0), 0)
  const settled = distributions
    .filter(d => d.status === '已回款')
    .reduce((s, d) => s + (d.settledAmount || 0), 0)
  res.json({ total, pendingSample, pendingSettle, returnedQty, settled })
})

module.exports = router
