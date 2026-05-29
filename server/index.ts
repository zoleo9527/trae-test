import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/logger';
import path from 'path';

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    code: 42900,
    message: '请求过于频繁，请稍后再试',
  },
});
app.use('/api/', apiLimiter);

app.use(morgan('combined', {
  stream: {
    write: (message) => loggerMiddleware.info(message.trim()),
  },
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use(routes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
  ==========================================
  🚀 汽配商行-退货鉴定与退款复核系统
  ==========================================
  服务地址: http://localhost:${PORT}
  API文档:  http://localhost:${PORT}/api/health
  前端页面: http://localhost:${PORT}
  ==========================================
  测试账号:
  - 门店老板: store_owner / 123456
  - 配件销售: sales / 123456
  - 仓库管库: warehouse / 123456
  ==========================================
  `);
});

export default app;
