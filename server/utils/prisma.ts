import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'info', emit: 'event' },
    { level: 'query', emit: 'event' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      console.warn(`[SLOW QUERY] ${e.duration}ms: ${e.query}`);
    }
  });
}

export default prisma;
