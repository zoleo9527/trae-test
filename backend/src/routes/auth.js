const express = require('express')
const { users, rolesMap } = require('../data/store')
const { sign } = require('../middleware/auth')

const router = express.Router()

const defaultRoutes = {
  channel_manager: '/activities',
  distribution_specialist: '/distributions',
  finance: '/',
  admin: '/'
}

function buildResponse(user) {
  const token = sign(user)
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleName: rolesMap[user.role],
      defaultRoute: defaultRoutes[user.role] || '/'
    }
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) return res.status(401).json({ error: '账号或密码错误' })
  res.json(buildResponse(user))
})

router.post('/switch-role', (req, res) => {
  const { username } = req.body || {}
  const user = users.find(u => u.username === username)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json(buildResponse(user))
})

router.get('/list', (req, res) => {
  res.json(
    users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      roleName: rolesMap[u.role],
      defaultRoute: defaultRoutes[u.role] || '/'
    }))
  )
})

module.exports = router
