import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import logger from './lib/logger'
import authRoutes from './routes/auth'
import rentalRoutes from './routes/rental'
import depositRoutes from './routes/deposit'
import damageClaimRoutes from './routes/damageClaim'
import maintenanceRoutes from './routes/maintenance'
import commonRoutes from './routes/common'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    query: req.query,
    hasBody: Object.keys(req.body || {}).length > 0,
  })
  next()
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/rentals', rentalRoutes)
app.use('/api/deposits', depositRoutes)
app.use('/api/damage-claims', damageClaimRoutes)
app.use('/api/maintenances', maintenanceRoutes)
app.use('/api/common', commonRoutes)

app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '乐器租赁-押金结算与损坏申诉服务',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        rentals: '/api/rentals',
        deposits: '/api/deposits',
        damageClaims: '/api/damage-claims',
        maintenances: '/api/maintenances',
        common: '/api/common',
      },
    },
  })
})

app.use(errorHandler)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    code: 404,
  })
})

app.listen(PORT, () => {
  logger.info(`服务器启动成功，端口: ${PORT}`)
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     乐器租赁-押金结算与损坏申诉后端服务已启动             ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                         ║
║  API文档:  http://localhost:${PORT}/api                      ║
║  健康检查: http://localhost:${PORT}/api/health               ║
╠════════════════════════════════════════════════════════════╣
║  测试账号:                                                  ║
║  门店老板:   owner / 123456                                ║
║  租赁顾问:   advisor / 123456                              ║
║  维修师傅:   tech / 123456                                 ║
╚════════════════════════════════════════════════════════════╝
  `)
})
