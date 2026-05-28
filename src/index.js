import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import berthingRoutes from './routes/berthing.js';
import documentRoutes from './routes/documents.js';
import taskRoutes from './routes/tasks.js';
import auditRoutes from './routes/audit.js';
import exportRoutes from './routes/export.js';
import chainRoutes from './routes/chain.js';
import feeRoutes from './routes/fees.js';
import crewRoutes from './routes/crew.js';
import supplyRoutes from './routes/supply.js';
import communicationRoutes from './routes/communications.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请15分钟后再试',
  },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: '登录尝试次数过多，请15分钟后再试',
  },
});
app.use('/api/auth/login', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '船舶代理管理系统 API 运行正常',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/berthing', berthingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/chain', chainRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/supply', supplyRoutes);
app.use('/api/communications', communicationRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `路由不存在: ${req.method} ${req.path}`,
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   船舶代理管理系统 - 靠泊计划与证件报备                   ║
║                                                           ║
║   API 服务已启动                                          ║
║   地址: http://localhost:${PORT}                           ║
║   健康检查: GET /api/health                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
