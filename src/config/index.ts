import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'nursery-traceability-secret-key-2024',
  jwtExpiresIn: '24h',
  nodeEnv: process.env.NODE_ENV || 'development',
  idempotencyExpireHours: 24,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
} as const;

export default config;
