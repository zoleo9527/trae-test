import { Router } from 'express';
import authRoutes from './auth.routes';
import inquiryRoutes from './inquiry.routes';
import stockLockRoutes from './stockLock.routes';
import returnOrderRoutes from './returnOrder.routes';
import refundOrderRoutes from './refundOrder.routes';
import auditRoutes from './audit.routes';
import exportRoutes from './export.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      timestamp: Date.now(),
    },
  });
});

router.use('/api/auth', authRoutes);
router.use('/api/inquiries', inquiryRoutes);
router.use('/api/stock-locks', stockLockRoutes);
router.use('/api/return-orders', returnOrderRoutes);
router.use('/api/refund-orders', refundOrderRoutes);
router.use('/api/audit-logs', auditRoutes);
router.use('/api/export', exportRoutes);

export default router;
