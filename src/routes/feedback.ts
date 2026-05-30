import { Router } from 'express';
import {
  createFeedback,
  getFeedbackList,
  getFeedbackDetail,
  resolveFeedback,
} from '../controllers/feedbackController';
import { authenticate, requireVolunteerCoordinator } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createFeedbackSchema, resolveFeedbackSchema, feedbackListQuerySchema } from '../schemas/feedback';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(feedbackListQuerySchema), getFeedbackList);
router.get('/:id', getFeedbackDetail);
router.post('/', validateBody(createFeedbackSchema), createFeedback);
router.post('/:id/resolve', requireVolunteerCoordinator, validateBody(resolveFeedbackSchema), resolveFeedback);

export default router;
