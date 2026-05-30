import { Router } from 'express';
import { getAuditLogs, getAuditLogDetail } from '../controllers/logController';
import { authenticate, requireDirector } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { logListQuerySchema } from '../schemas/log';

const router = Router();

router.use(authenticate);

router.get('/', requireDirector, validateQuery(logListQuerySchema), getAuditLogs);
router.get('/:id', requireDirector, getAuditLogDetail);

export default router;
