import { Router } from 'express';
import {
  createCheckIn,
  manualCheckIn,
  getCheckInList,
  getCheckInDetail,
  markNoShow,
} from '../controllers/checkInController';
import { authenticate, requireVolunteerCoordinator } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createCheckInSchema, manualCheckInSchema } from '../schemas/checkin';
import { paginationSchema } from '../schemas/common';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(paginationSchema), getCheckInList);
router.get('/:id', getCheckInDetail);
router.post('/', validateBody(createCheckInSchema), createCheckIn);
router.post('/manual', requireVolunteerCoordinator, validateBody(manualCheckInSchema), manualCheckIn);
router.post('/no-show/:registrationId', requireVolunteerCoordinator, markNoShow);

export default router;
