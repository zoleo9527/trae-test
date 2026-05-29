import { Router } from 'express';
import {
  createInquiryController,
  updateInquiryController,
  updateInquiryStatusController,
  getInquiryController,
  getInquiryListController,
  addInquiryRemarkController,
} from '../controllers/inquiry';
import { authenticate, requirePermission } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { validate } from '../middleware/validation';
import { OperationType } from '../types/enums';
import {
  InquiryCreateSchema,
  InquiryUpdateSchema,
  StatusUpdateSchema,
  RemarkAddSchema,
  QueryFilterSchema,
} from '../types/dto';

const router = Router();

router.use(authenticate);

router.get('/', validate(QueryFilterSchema), getInquiryListController);
router.post('/', requirePermission(OperationType.CREATE), idempotency, validate(InquiryCreateSchema), createInquiryController);
router.get('/:id', getInquiryController);
router.put('/:id', requirePermission(OperationType.UPDATE), validate(InquiryUpdateSchema), updateInquiryController);
router.patch('/:id/status', requirePermission(OperationType.SUBMIT), validate(StatusUpdateSchema), updateInquiryStatusController);
router.post('/:id/remarks', requirePermission(OperationType.ADD_REMARK), validate(RemarkAddSchema), addInquiryRemarkController);

export default router;
