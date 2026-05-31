const idempotencyCache = new Map();

export const idempotency = (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  if (!idempotencyKey) {
    return next();
  }

  const cacheKey = `${req.method}:${req.path}:${idempotencyKey}`;
  
  if (idempotencyCache.has(cacheKey)) {
    const cached = idempotencyCache.get(cacheKey);
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      idempotencyCache.set(cacheKey, {
        status: res.statusCode,
        body,
        timestamp: Date.now(),
      });
      
      setTimeout(() => {
        idempotencyCache.delete(cacheKey);
      }, 24 * 60 * 60 * 1000);
    }
    return originalJson(body);
  };

  next();
};
