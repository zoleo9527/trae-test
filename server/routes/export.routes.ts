import { Router } from 'express';
import { exportDataController } from '../controllers/export';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { OperationType } from '../types/enums';
import { ExportSchema } from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(OperationType.EXPORT), validate(ExportSchema), exportDataController);

export default router;
