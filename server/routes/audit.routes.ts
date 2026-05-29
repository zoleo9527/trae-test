import { Router } from 'express';
import { getAuditLogsController, getAuditLogsByInquiryController } from '../controllers/audit';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { OperationType } from '../types/enums';
import { QueryFilterSchema } from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(OperationType.EXPORT), validate(QueryFilterSchema), getAuditLogsController);
router.get('/inquiry/:inquiryId', getAuditLogsByInquiryController);

export default router;
