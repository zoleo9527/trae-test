import { Router } from 'express';
import authRoutes from './auth';
import activityRoutes from './activity';
import registrationRoutes from './registration';
import checkInRoutes from './checkin';
import libraryRoutes from './library';
import logRoutes from './log';
import exportRoutes from './export';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '城市书房活动系统运行正常',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/activities', activityRoutes);
router.use('/registrations', registrationRoutes);
router.use('/checkins', checkInRoutes);
router.use('/libraries', libraryRoutes);
router.use('/logs', logRoutes);
router.use('/export', exportRoutes);

export default router;
