import { Router } from 'express';
import { exportRegistrations, exportCheckIns } from '../controllers/exportController';
import { authenticate, requireActivityOperator } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireActivityOperator);

router.get('/registrations', exportRegistrations);
router.get('/checkins', exportCheckIns);

export default router;
