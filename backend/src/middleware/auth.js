const jwt = require('jsonwebtoken')
const { users } = require('../data/store')

const SECRET = 'book-distribution-secret'

function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '7d' }
  )
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: '缺少登录凭证' })
  try {
    const payload = jwt.verify(token, SECRET)
    const user = users.find(u => u.id === payload.id)
    if (!user) return res.status(401).json({ error: '用户不存在' })
    req.user = { id: user.id, username: user.username, role: user.role, name: user.name }
    next()
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

function roleRequired(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登录' })
    if (req.user.role === 'admin') return next()
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '无权访问' })
    }
    next()
  }
}

module.exports = { sign, authRequired, roleRequired, SECRET }
