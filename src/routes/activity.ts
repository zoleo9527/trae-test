import { Router } from 'express';
import {
  createActivity,
  getActivityList,
  getActivityDetail,
  updateActivity,
  updateActivityStatus,
  deleteActivity,
  getActivityStats,
} from '../controllers/activityController';
import { authenticate, requireActivityOperator } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createActivitySchema, updateActivitySchema, activityListQuerySchema } from '../schemas/activity';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(activityListQuerySchema), getActivityList);
router.get('/:id', getActivityDetail);
router.get('/:id/stats', getActivityStats);
router.post('/', requireActivityOperator, validateBody(createActivitySchema), createActivity);
router.put('/:id', requireActivityOperator, validateBody(updateActivitySchema), updateActivity);
router.patch('/:id/status', requireActivityOperator, updateActivityStatus);
router.delete('/:id', requireActivityOperator, deleteActivity);

export default router;
