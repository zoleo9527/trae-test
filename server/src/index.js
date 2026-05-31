import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import orderRoutes from './routes/orders.js';
import productionRoutes from './routes/productions.js';
import materialRoutes from './routes/materials.js';
import wasteRoutes from './routes/waste.js';
import refundRoutes from './routes/refunds.js';
import auditRoutes from './routes/audit.js';
import commonRoutes from './routes/common.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${uuidv4()}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.use('/api/common', commonRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/audit', auditRoutes);

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 烘焙坊系统服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
