import { Router } from 'express';
import {
  sendNotification,
  getNotificationList,
  getNotificationDetail,
  markNotificationRead,
  resendNotification,
} from '../controllers/notificationController';
import { authenticate, requireActivityOperator } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { sendNotificationSchema, notificationListQuerySchema } from '../schemas/notification';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(notificationListQuerySchema), getNotificationList);
router.get('/:id', getNotificationDetail);
router.post('/', requireActivityOperator, validateBody(sendNotificationSchema), sendNotification);
router.post('/:id/read', markNotificationRead);
router.post('/:id/resend', requireActivityOperator, resendNotification);

export default router;
