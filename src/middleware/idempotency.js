import prisma from '../config/prisma.js';
import { IdempotencyError } from '../utils/errors.js';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';

const idempotencyStore = new Map();

const getIdempotencyKey = (req) => {
  const key = req.headers[IDEMPOTENCY_HEADER];
  if (!key) {
    return null;
  }
  return `${req.method}:${req.path}:${key}`;
};

const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) {
    return next();
  }

  const cached = idempotencyStore.get(idempotencyKey);

  if (cached) {
    if (cached.processing) {
      return res.status(202).json({
        success: false,
        code: 'IDEMPOTENCY_PROCESSING',
        message: '请求正在处理中，请稍后重试',
      });
    }

    if (cached.response) {
      return res.status(cached.response.status).json(cached.response.body);
    }
  }

  idempotencyStore.set(idempotencyKey, {
    processing: true,
    startTime: Date.now(),
  });

  const originalJson = res.json;
  res.json = function(body) {
    idempotencyStore.set(idempotencyKey, {
      processing: false,
    response: {
        status: res.statusCode,
        body,
      },
      completedAt: Date.now(),
    });

    setTimeout(() => {
      idempotencyStore.delete(idempotencyKey);
    }, 24 * 60 * 60 * 1000);

    return originalJson.call(this, body);
  };

  next();
};

const cleanExpiredKeys = () => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.processing && now - value.startTime > 5 * 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }
};

setInterval(cleanExpiredKeys, 60 * 1000);

export { idempotencyMiddleware };
