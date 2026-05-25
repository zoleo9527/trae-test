const express = require('express')
const { authors, books, channels, users, rolesMap } = require('../data/store')

const router = express.Router()

router.get('/authors', (req, res) => res.json(authors))
router.get('/books', (req, res) => res.json(books))
router.get('/channels', (req, res) => res.json(channels))
router.get('/owners', (req, res) => {
  res.json(
    users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      roleName: rolesMap[u.role]
    }))
  )
})
router.get('/meta', (req, res) => {
  res.json({
    activityStatuses: ['待确认', '进行中', '已完成', '已取消'],
    activityTypes: ['签售', '线上分享', '读书会', '巡讲', '讲座'],
    distributionStatuses: ['样书待回执', '销售中', '待对账', '已回款', '已终止'],
    channelTypes: ['电商', '实体']
  })
})

module.exports = router
