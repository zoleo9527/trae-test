import { Router } from 'express';
import {
  createReturnOrderController,
  updateReturnOrderController,
  updateReturnOrderStatusController,
  inspectReturnItemController,
  getReturnOrderController,
  getReturnOrderByInquiryController,
  getReturnOrderListController,
  addReturnOrderRemarkController,
} from '../controllers/returnOrder';
import { authenticate, requirePermission } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { validate } from '../middleware/validation';
import { OperationType } from '../types/enums';
import {
  ReturnOrderCreateSchema,
  ReturnOrderUpdateSchema,
  StatusUpdateSchema,
  ReturnItemInspectSchema,
  RemarkAddSchema,
  QueryFilterSchema,
} from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', validate(QueryFilterSchema), getReturnOrderListController);
router.post('/', requirePermission(OperationType.CREATE), idempotency, validate(ReturnOrderCreateSchema), createReturnOrderController);
router.get('/:id', getReturnOrderController);
router.get('/inquiry/:inquiryId', getReturnOrderByInquiryController);
router.put('/:id', requirePermission(OperationType.UPDATE), validate(ReturnOrderUpdateSchema), updateReturnOrderController);
router.patch('/:id/status', requirePermission(OperationType.APPROVE), validate(StatusUpdateSchema), updateReturnOrderStatusController);
router.patch('/:id/items/:itemId/inspect', requirePermission(OperationType.INSPECT), validate(ReturnItemInspectSchema), inspectReturnItemController);
router.post('/:id/remarks', requirePermission(OperationType.ADD_REMARK), validate(RemarkAddSchema), addReturnOrderRemarkController);

export default router;
