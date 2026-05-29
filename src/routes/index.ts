import { Router, Response } from 'express';
import authRoutes from './auth.routes';
import harvestRoutes from './harvest.routes';
import maintenanceRoutes from './maintenance.routes';
import visitRoutes from './visit.routes';
import negotiationRoutes from './negotiation.routes';
import dashboardRoutes from './dashboard.routes';
import plotRoutes from './plot.routes';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/health', (_req, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

router.get(
  '/debug',
  authenticate,
  (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    res.json({
      success: true,
      data: {
        user: req.user,
        headers: {
          'x-idempotency-key': req.headers['x-idempotency-key'],
        },
      },
    });
  }
);

router.use('/auth', authRoutes);
router.use('/harvests', harvestRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/visits', visitRoutes);
router.use('/negotiations', negotiationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/plots', plotRoutes);

export default router;
