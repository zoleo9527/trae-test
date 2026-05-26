function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500
  const response = {
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || '服务器内部错误',
    details: err.details || null,
    timestamp: new Date().toISOString()
  }
  if (!err.isOperational) {
    console.error('[INTERNAL_ERROR]', err)
    response.message = '服务器内部错误'
  }
  res.status(statusCode).json(response)
}

function notFoundHandler(_req, _res, next) {
  const err = new (require('../errors').NotFoundError)('接口不存在')
  next(err)
}

module.exports = { errorHandler, notFoundHandler }
