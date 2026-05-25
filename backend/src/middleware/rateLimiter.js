const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const apiLimiter = createRateLimiter(15 * 60 * 1000, 1000);
const loginLimiter = createRateLimiter(15 * 60 * 1000, 5);
const strictLimiter = createRateLimiter(60 * 1000, 10);

module.exports = {
  apiLimiter,
  loginLimiter,
  strictLimiter,
  createRateLimiter,
};
