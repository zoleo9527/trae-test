const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function createAuditMiddleware(entityType) {
  return function auditMiddleware(req, res, next) {
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
      let logEntityType = entityType || 'UNKNOWN'
      let entityId = null

      const pathParts = req.path.split('/').filter(Boolean)
      if (pathParts.length >= 1 && /^[a-z0-9]{20,}$/i.test(pathParts[0])) {
        entityId = pathParts[0]
      }

      if (req.body && Object.keys(req.body).length > 0) {
        if (req.body.collectionOrderId && /^[a-z0-9]{20,}$/i.test(req.body.collectionOrderId)) {
          entityId = req.body.collectionOrderId
        } else if (req.body.orderId && /^[a-z0-9]{20,}$/i.test(req.body.orderId)) {
          entityId = req.body.orderId
        }
      }

      if (responseData?.data?.id && !entityId) {
        entityId = responseData.data.id
      }

      if (responseData?.data?.order?.id && !entityId) {
        entityId = responseData.data.order.id
      }

      const isSuccess = res.statusCode >= 200 && res.statusCode < 400

      prisma.auditLog.create({
        data: {
        userId: req.user?.id || null,
        action: `${req.method} ${req.baseUrl}${req.path}`,
        entityType: logEntityType,
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
}

module.exports = { createAuditMiddleware, auditMiddleware: createAuditMiddleware() }
