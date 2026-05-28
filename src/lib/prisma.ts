import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
})

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Query: ${e.query}`)
    console.log(`Params: ${e.params}`)
  }
})

prisma.$on('error', (e) => {
  console.error(`Prisma Error: ${e.message}`)
})

export default prisma
