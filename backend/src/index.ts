import express from 'express';
import cors from 'cors';
import { db } from './data/database';
import { authMiddleware } from './middleware/auth';
import authRouter from './routes/auth';
import showsRouter from './routes/shows';
import ordersRouter from './routes/orders';
import refundsRouter from './routes/refunds';
import logsRouter from './routes/logs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/shows', authMiddleware, showsRouter);
app.use('/api/orders', authMiddleware, ordersRouter);
app.use('/api/refunds', authMiddleware, refundsRouter);
app.use('/api/logs', authMiddleware, logsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Theater Ticket API is running' });
});

async function startServer() {
  await db.initialize();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);
