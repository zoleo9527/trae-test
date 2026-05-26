import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import sampleRoutes from './routes/samples';
import borrowRoutes from './routes/borrows';
import returnRoutes from './routes/returns';
import commonRoutes from './routes/common';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/samples', authMiddleware, sampleRoutes);
app.use('/api/borrows', authMiddleware, borrowRoutes);
app.use('/api/returns', authMiddleware, returnRoutes);
app.use('/api', authMiddleware, commonRoutes);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ code: 404, message: 'API Not Found' });
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 家具展厅样品管理系统已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📖 演示入口: http://localhost:${PORT}`);
});
