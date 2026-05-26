const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'recycle-station-dev-secret'

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, stationId: user.stationId, realName: user.realName },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' })
  }
  try {
    const token = header.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token 无效或已过期' })
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未授权' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: '权限不足',
        allowed: roles,
        current: req.user.role,
      })
    }
    next()
  }
}

module.exports = { signToken, authMiddleware, requireRoles, JWT_SECRET }
