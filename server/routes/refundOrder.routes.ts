import { Router } from 'express';
import {
  createRefundOrderController,
  updateRefundOrderController,
  updateRefundOrderStatusController,
  getRefundOrderController,
  getRefundOrderByInquiryController,
  getRefundOrderByReturnController,
  getRefundOrderListController,
  addRefundOrderRemarkController,
} from '../controllers/refundOrder';
import { authenticate, requirePermission } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { validate } from '../middleware/validation';
import { OperationType } from '../types/enums';
import {
  RefundOrderCreateSchema,
  RefundOrderUpdateSchema,
  StatusUpdateSchema,
  RemarkAddSchema,
  QueryFilterSchema,
} from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', validate(QueryFilterSchema), getRefundOrderListController);
router.post('/', requirePermission(OperationType.CREATE), idempotency, validate(RefundOrderCreateSchema), createRefundOrderController);
router.get('/:id', getRefundOrderController);
router.get('/inquiry/:inquiryId', getRefundOrderByInquiryController);
router.get('/return/:returnOrderId', getRefundOrderByReturnController);
router.put('/:id', requirePermission(OperationType.UPDATE), validate(RefundOrderUpdateSchema), updateRefundOrderController);
router.patch('/:id/status', requirePermission(OperationType.APPROVE), validate(StatusUpdateSchema), updateRefundOrderStatusController);
router.post('/:id/remarks', requirePermission(OperationType.ADD_REMARK), validate(RemarkAddSchema), addRefundOrderRemarkController);

export default router;
