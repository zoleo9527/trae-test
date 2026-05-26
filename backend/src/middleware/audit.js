const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const ENTITY_TYPE_MAP = {
  'collections': 'COLLECTION_ORDER',
  'sortings': 'SORTING_RECORD',
  'price-adjustments': 'PRICE_ADJUSTMENT',
  'settlements': 'SETTLEMENT',
  'notes': 'NOTE',
  'exports': 'EXPORT',
  'auth': 'AUTH',
}

function auditMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next()
  }

  const startTime = Date.now()
  const originalJson = res.json.bind(res)
  let responseData = null

  res.json = function (data) {
    responseData = data
    return originalJson(data)
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime
    let entityType = 'UNKNOWN'
    let entityId = null

    const pathParts = req.path.split('/').filter(Boolean)
    if (pathParts.length >= 1) {
      entityType = ENTITY_TYPE_MAP[pathParts[0]] || pathParts[0].toUpperCase()
    }
    if (pathParts.length >= 2 && /^[a-z0-9]{20,}$/i.test(pathParts[1])) {
      entityId = pathParts[1]
    }

    if (responseData?.data?.id && !entityId) {
      entityId = responseData.data.id
    }

    const isSuccess = res.statusCode >= 200 && res.statusCode < 400

    prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: `${req.method} ${req.path}`,
        entityType,
        entityId,
        changes: {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration,
          success: isSuccess,
          requestBody: req.body,
          responseSummary: responseData ? {
            hasData: !!responseData.data,
            id: responseData.data?.id || null,
            count: responseData.count || responseData.data?.length || 0,
          } : null,
        },
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']?.slice(0, 500),
      },
    }).catch((err) => {
      console.error('[AUDIT] 写入日志失败:', err.message)
    })
  })

  next()
}

module.exports = { auditMiddleware }
