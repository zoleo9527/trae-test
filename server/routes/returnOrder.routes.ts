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
  addReturnOrderEvidenceController,
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
  EvidenceCreateSchema,
  QueryFilterSchema,
} from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', validate(QueryFilterSchema), getReturnOrderListController);
router.post('/', requirePermission(OperationType.CREATE), idempotency, validate(ReturnOrderCreateSchema), createReturnOrderController);
router.get('/:id', getReturnOrderController);
router.get('/inquiry/:inquiryId', getReturnOrderByInquiryController);
router.put('/:id', requirePermission(OperationType.UPDATE), validate(ReturnOrderUpdateSchema), updateReturnOrderController);
router.patch('/:id/status', validate(StatusUpdateSchema), updateReturnOrderStatusController);
router.patch('/:id/items/:itemId/inspect', requirePermission(OperationType.INSPECT), validate(ReturnItemInspectSchema), inspectReturnItemController);
router.post('/:id/remarks', requirePermission(OperationType.ADD_REMARK), validate(RemarkAddSchema), addReturnOrderRemarkController);
router.post('/:id/evidences', requirePermission(OperationType.ADD_REMARK), validate(EvidenceCreateSchema), addReturnOrderEvidenceController);

export default router;
