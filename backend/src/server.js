require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const requestId = require('./middleware/requestId');
const requestLogger = require('./middleware/requestLogger');
const idempotency = require('./middleware/idempotency');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { NotFoundError } = require('./utils/errors');
const routes = require('./routes');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(idempotency());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);
app.use(apiLimiter);

app.use('/api/v1', routes);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API Base: http://localhost:${PORT}/api/v1`);
  logger.info(`💊 Health Check: http://localhost:${PORT}/api/v1/health`);
});

module.exports = app;
