import { Router } from 'express';
import {
  createStockLockController,
  updateStockLockController,
  updateStockLockStatusController,
  getStockLockController,
  getStockLockByInquiryController,
  getStockLockListController,
  addStockLockRemarkController,
} from '../controllers/stockLock';
import { authenticate, requirePermission } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { validate } from '../middleware/validation';
import { OperationType } from '../types/enums';
import {
  StockLockCreateSchema,
  StockLockUpdateSchema,
  StatusUpdateSchema,
  RemarkAddSchema,
  QueryFilterSchema,
} from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', validate(QueryFilterSchema), getStockLockListController);
router.post('/', requirePermission(OperationType.LOCK), idempotency, validate(StockLockCreateSchema), createStockLockController);
router.get('/:id', getStockLockController);
router.get('/inquiry/:inquiryId', getStockLockByInquiryController);
router.put('/:id', requirePermission(OperationType.LOCK), validate(StockLockUpdateSchema), updateStockLockController);
router.patch('/:id/status', validate(StatusUpdateSchema), updateStockLockStatusController);
router.post('/:id/remarks', requirePermission(OperationType.ADD_REMARK), validate(RemarkAddSchema), addStockLockRemarkController);

export default router;
