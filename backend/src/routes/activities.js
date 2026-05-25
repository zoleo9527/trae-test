const express = require('express')
const { authRequired } = require('../middleware/auth')
const { authorActivities, authors, channels, users, rolesMap } = require('../data/store')

const router = express.Router()

function enrich(activity) {
  const author = authors.find(a => a.id === activity.authorId)
  const channel = channels.find(c => c.id === activity.channelId)
  return {
    ...activity,
    authorName: author ? author.name : '-',
    authorCategory: author ? author.category : '-',
    channelName: channel ? channel.name : '-',
    channelType: channel ? channel.type : '-',
    ownerName: users.find(u => u.id === activity.ownerId)?.name || '-'
  }
}

function visibleActivities(user) {
  if (user.role === 'admin' || user.role === 'channel_manager' || user.role === 'finance') {
    return authorActivities
  }
  if (user.role === 'distribution_specialist') {
    return authorActivities.filter(a => a.ownerId === user.id)
  }
  return authorActivities
}

function canEditActivity(user, activity) {
  if (user.role === 'admin' || user.role === 'channel_manager') return true
  if (user.role === 'distribution_specialist') return activity.ownerId === user.id
  return false
}

function canCreateActivity(user) {
  return user.role === 'admin' || user.role === 'channel_manager' || user.role === 'distribution_specialist'
}

router.get('/', authRequired, (req, res) => {
  const {
    keyword,
    authorId,
    channelId,
    type,
    status,
    ownerId,
    dateFrom,
    dateTo
  } = req.query

  let list = visibleActivities(req.user).map(enrich)
  if (keyword) {
    const kw = keyword.trim()
    list = list.filter(a =>
      a.title.includes(kw) ||
      a.authorName.includes(kw) ||
      a.location.includes(kw)
    )
  }
  if (authorId) list = list.filter(a => a.authorId === authorId)
  if (channelId) list = list.filter(a => a.channelId === channelId)
  if (type) list = list.filter(a => a.type === type)
  if (status) list = list.filter(a => a.status === status)
  if (ownerId) list = list.filter(a => a.ownerId === ownerId)
  if (dateFrom) list = list.filter(a => a.planDate >= dateFrom)
  if (dateTo) list = list.filter(a => a.planDate <= dateTo)

  list.sort((a, b) => (a.planDate < b.planDate ? 1 : -1))
  res.json({ list, total: list.length })
})

router.get('/:id', authRequired, (req, res) => {
  const a = visibleActivities(req.user).find(x => x.id === req.params.id)
  if (!a) return res.status(404).json({ error: '活动不存在或无权查看' })
  res.json(enrich(a))
})

router.post('/', authRequired, (req, res) => {
  if (!canCreateActivity(req.user)) {
    return res.status(403).json({ error: '当前角色无权新建活动' })
  }
  const body = req.body || {}
  const id = 'act' + (authorActivities.length + 1)
  const activity = {
    id,
    title: body.title || '未命名活动',
    authorId: body.authorId,
    channelId: body.channelId,
    type: body.type || '签售',
    planDate: body.planDate,
    location: body.location || '',
    expectedQty: Number(body.expectedQty) || 0,
    status: body.status || '待确认',
    ownerId: body.ownerId || req.user.id,
    timeline: [
      {
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        actor: req.user.name,
        action: '创建活动',
        note: body.remarks || ''
      }
    ],
    remarks: body.remarks || ''
  }
  authorActivities.unshift(activity)
  res.json(enrich(activity))
})

router.post('/:id/timeline', authRequired, (req, res) => {
  const a = visibleActivities(req.user).find(x => x.id === req.params.id)
  if (!a) return res.status(404).json({ error: '活动不存在或无权查看' })
  if (!canEditActivity(req.user, a) && req.user.role !== 'finance') {
    return res.status(403).json({ error: '无权追加跟进' })
  }
  const { action, note } = req.body || {}
  a.timeline.push({
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    actor: req.user.name,
    action: action || '跟进',
    note: note || ''
  })
  res.json(enrich(a))
})

router.patch('/:id', authRequired, (req, res) => {
  const a = visibleActivities(req.user).find(x => x.id === req.params.id)
  if (!a) return res.status(404).json({ error: '活动不存在或无权查看' })
  if (!canEditActivity(req.user, a)) {
    return res.status(403).json({ error: '无权修改活动' })
  }
  const body = req.body || {}
  const prevStatus = a.status
  Object.assign(a, body)
  if (body.status && body.status !== prevStatus) {
    a.timeline.push({
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      actor: req.user.name,
      action: '状态变更',
      note: `${prevStatus} → ${body.status}`
    })
  }
  res.json(enrich(a))
})

module.exports = router
