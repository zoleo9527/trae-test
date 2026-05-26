const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config')
const { db } = require('../db')
const { AuthError, ValidationError } = require('../errors')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) throw new ValidationError('用户名和密码必填')

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user) throw new AuthError('用户名或密码错误')
    if (!user.is_active) throw new AuthError('账号已禁用')

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) throw new AuthError('用户名或密码错误')

    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

    const store = user.store_id ? db.prepare('SELECT id, name FROM stores WHERE id = ?').get(user.store_id) : null

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        store_id: user.store_id,
        store_name: store?.name || null
      }
    })
  } catch (e) { next(e) }
})

router.get('/me', authRequired, (req, res) => {
  const store = req.user.store_id ? db.prepare('SELECT id, name FROM stores WHERE id = ?').get(req.user.store_id) : null
  res.json({
    id: req.user.id,
    username: req.user.username,
    full_name: req.user.full_name,
    role: req.user.role,
    store_id: req.user.store_id,
    store_name: store?.name || null
  })
})

module.exports = router
