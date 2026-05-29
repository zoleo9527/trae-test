import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { extractIdempotencyKey } from './middleware/idempotency.middleware';
import { requestLogger, errorLogger } from './middleware/logger.middleware';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import routes from './routes';
import { config } from './config';

const app = express();

app.set('trust proxy', true);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(extractIdempotencyKey);

if (config.nodeEnv !== 'test') {
  app.use(requestLogger);
}

app.use('/api', routes);

if (config.nodeEnv !== 'test') {
  app.use(errorLogger);
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
