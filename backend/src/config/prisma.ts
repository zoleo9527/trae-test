import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB Query] ${e.query}`);
    console.log(`[DB Params] ${e.params}`);
    console.log(`[DB Duration] ${e.duration}ms`);
  }
});

export default prisma;
