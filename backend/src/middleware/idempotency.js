const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex')
}

function idempotencyMiddleware(req, res, next) {
  const key = req.headers['x-idempotency-key']
  if (!key) return next()

  const method = req.method
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next()

  const requestHash = hashBody(req.body)

  prisma.idempotencyRecord.findUnique({ where: { idempotencyKey: key } })
    .then((record) => {
      if (record) {
        if (record.requestHash !== requestHash) {
          return res.status(409).json({
            error: '幂等键冲突：相同的幂等键请求体不一致',
          })
        }
        if (record.expiresAt < new Date()) {
          return next()
        }
        if (record.responseBody) {
          return res.json(record.responseBody)
        }
        return res.status(409).json({ error: '请求正在处理中，请稍后重试' })
      }

      prisma.idempotencyRecord.create({
        data: {
          idempotencyKey: key,
          requestHash,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL),
        },
      }).then(() => {
        const originalJson = res.json.bind(res)
        res.json = function (data) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            prisma.idempotencyRecord.update({
              where: { idempotencyKey: key },
              data: { responseBody: data },
            }).catch(() => {})
          }
          return originalJson(data)
        }
        next()
      }).catch(() => next())
    })
    .catch(() => next())
}

module.exports = { idempotencyMiddleware }
