const prisma = require('../config/prisma');
const logger = require('../config/logger');

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const DEFAULT_EXPIRE_HOURS = 24;

module.exports = (options = {}) => {
  const expireHours = options.expireHours || DEFAULT_EXPIRE_HOURS;
  const methods = options.methods || ['POST', 'PUT', 'PATCH'];

  return async (req, res, next) => {
    if (!methods.includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[IDEMPOTENCY_HEADER];

    if (!idempotencyKey) {
      return next();
    }

    try {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });

      if (existing) {
        logger.info(`Idempotent request detected: ${idempotencyKey}`);
        const cachedResponse = JSON.parse(existing.response);
        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expireHours);

        prisma.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            response: JSON.stringify({
              statusCode: res.statusCode,
              body,
            }),
            expiresAt,
          },
        }).catch((err) => {
          logger.error('Failed to store idempotency record:', err);
        });

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Idempotency middleware error:', error);
      next(error);
    }
  };
};
