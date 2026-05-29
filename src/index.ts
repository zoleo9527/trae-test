import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import expressWinston from 'express-winston';
import logger from './lib/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { idempotencyMiddleware } from './middleware/idempotency';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import reconciliationRoutes from './routes/reconciliation.routes';
import paymentRoutes from './routes/payment.routes';
import documentRoutes from './routes/document.routes';
import teardownRoutes from './routes/teardown.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
}));

app.use(idempotencyMiddleware);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reconciliations', reconciliationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/teardowns', teardownRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`服务器运行在 http://localhost:${PORT}`);
  logger.info(`API文档: GET /api 下的路由`);
});

export default app;
