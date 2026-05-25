const logger = require('../config/logger');

module.exports = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip, headers, requestId } = req;

  logger.info(`Incoming request: ${method} ${url}`, {
    requestId,
    method,
    url,
    ip,
    userAgent: headers['user-agent'],
    userId: req.user?.id || null,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request completed: ${method} ${url} ${res.statusCode} (${duration}ms)`, {
      requestId,
      method,
      url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id || null,
    });
  });

  next();
};
