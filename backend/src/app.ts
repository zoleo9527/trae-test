import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import swaggerSpecs from './config/swagger';

import { requestContextMiddleware } from './middleware/requestContext';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { operationLogMiddleware } from './middleware/operationLog';
import { idempotencyMiddleware } from './middleware/idempotency';

import authRoutes from './modules/auth/auth.routes';
import repairOrderRoutes from './modules/repair-orders/repairOrder.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import partApplicationRoutes from './modules/part-applications/application.routes';
import commonRoutes from './modules/common/common.routes';

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.isDev ? '*' : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['X-Trace-Id', 'X-Request-Id'],
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
  },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(requestContextMiddleware);
app.use(operationLogMiddleware);
app.use(idempotencyMiddleware);

app.get('/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: '钟表售后系统 API 文档',
  })
);

const apiPrefix = config.apiVersion;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/repair-orders`, repairOrderRoutes);
app.use(`${apiPrefix}/inventory`, inventoryRoutes);
app.use(`${apiPrefix}/part-applications`, partApplicationRoutes);
app.use(`${apiPrefix}`, commonRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
