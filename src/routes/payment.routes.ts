import { Router } from 'express';
import {
  createPayment,
  approvePayment,
  markPaid,
  rejectPayment,
  getPayment,
  getPaymentList,
  addComment,
  getAuditLogs,
} from '../controllers/payment.controller';
import { authenticate, requireOneOfRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', getPaymentList);
router.post('/', createPayment);
router.get('/:id', getPayment);
router.post('/:id/approve', requireOneOfRoles(Role.FINANCE, Role.ADMIN), approvePayment);
router.post('/:id/paid', requireOneOfRoles(Role.FINANCE, Role.ADMIN), markPaid);
router.post('/:id/reject', requireOneOfRoles(Role.FINANCE, Role.ADMIN), rejectPayment);
router.post('/:id/comments', addComment);
router.get('/:id/audit-logs', getAuditLogs);

export default router;
