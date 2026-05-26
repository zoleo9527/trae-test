const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')

const authRoutes = require('./routes/auth')
const collectionRoutes = require('./routes/collections')
const sortingRoutes = require('./routes/sortings')
const priceAdjustmentRoutes = require('./routes/priceAdjustments')
const settlementRoutes = require('./routes/settlements')
const noteRoutes = require('./routes/notes')
const exportRoutes = require('./routes/exports')
const { authMiddleware } = require('./middleware/auth')
const { idempotencyMiddleware } = require('./middleware/idempotency')
const { auditMiddleware } = require('./middleware/audit')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  req.prisma = prisma
  next()
})

app.use(idempotencyMiddleware)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)

app.use('/api/collections', authMiddleware, auditMiddleware, collectionRoutes)
app.use('/api/sortings', authMiddleware, auditMiddleware, sortingRoutes)
app.use('/api/price-adjustments', authMiddleware, auditMiddleware, priceAdjustmentRoutes)
app.use('/api/settlements', authMiddleware, auditMiddleware, settlementRoutes)
app.use('/api/notes', authMiddleware, auditMiddleware, noteRoutes)
app.use('/api/exports', authMiddleware, auditMiddleware, exportRoutes)

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack)
  if (err.code === 'P2025') {
    return res.status(404).json({ error: '资源不存在', detail: err.message })
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: '数据冲突', detail: err.message })
  }
  res.status(500).json({ error: '服务器错误', detail: err.message })
})

async function start() {
  try {
    await prisma.$connect()
    app.listen(PORT, () => {
      console.log(`废品回收站服务已启动: http://localhost:${PORT}`)
    })
  } catch (e) {
    console.error('启动失败:', e)
    process.exit(1)
  }
}

start()

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
