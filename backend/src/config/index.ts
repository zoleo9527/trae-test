export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  apiVersion: process.env.API_VERSION || '/api/v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  inventory: {
    lockDefaultDurationHours: 4,
    lockMaxDurationHours: 24,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
  },
  idempotency: {
    expireHours: 24,
  },
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
};

export default config;
