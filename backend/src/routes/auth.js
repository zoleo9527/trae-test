const express = require('express')
const bcrypt = require('bcryptjs')
const { signToken } = require('../middleware/auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const user = await req.prisma.user.findUnique({ where: { username } })
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = signToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      stationId: user.stationId,
    },
  })
})

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: '未登录' })
  const { JWT_SECRET } = require('../middleware/auth')
  const jwt = require('jsonwebtoken')
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET)
    res.json({ user: decoded })
  } catch {
    res.status(401).json({ error: 'Token 无效' })
  }
})

module.exports = router
