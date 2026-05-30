import { Router } from 'express';
import { getAuditLogs, getAuditLogDetail } from '../controllers/logController';
import { authenticate, requireDirector } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { paginationSchema } from '../schemas/common';

const router = Router();

router.use(authenticate);

router.get('/', requireDirector, validateQuery(paginationSchema), getAuditLogs);
router.get('/:id', requireDirector, getAuditLogDetail);

export default router;
