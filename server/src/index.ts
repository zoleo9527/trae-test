import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { initDatabase } from './db/init';
import { migrateData } from './db/migrate';
import { seedSampleData } from './db/seed';
import { errorHandler, notFoundHandler } from './middleware/error';
import routes from './routes';
import { initDefaultConfig } from './services/config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '高尔夫练习场对账系统 API 运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    initDatabase();
    initDefaultConfig();

    await seedSampleData();
    migrateData();

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📡 API 基础路径: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;
