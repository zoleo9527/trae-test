import { Router } from 'express';
import {
  createRegistration,
  getRegistrationList,
  getRegistrationDetail,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  supplementRegistration,
} from '../controllers/registrationController';
import { authenticate, requireActivityOperator } from '../middleware/auth';
import { idempotent } from '../middleware/idempotent';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createRegistrationSchema,
  rejectRegistrationSchema,
  supplementRegistrationSchema,
  registrationListQuerySchema,
} from '../schemas/registration';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(registrationListQuerySchema), getRegistrationList);
router.get('/:id', getRegistrationDetail);
router.post('/', idempotent, validateBody(createRegistrationSchema), createRegistration);
router.post('/:id/approve', requireActivityOperator, approveRegistration);
router.post('/:id/reject', requireActivityOperator, validateBody(rejectRegistrationSchema), rejectRegistration);
router.post('/:id/cancel', cancelRegistration);
router.post('/supplement', requireActivityOperator, validateBody(supplementRegistrationSchema), supplementRegistration);

export default router;
