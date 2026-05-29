import { Router } from 'express';
import {
  createReconciliation,
  updateReconciliation,
  submitReconciliation,
  approveReconciliation,
  rejectReconciliation,
  requestRevise,
  getReconciliation,
  getReconciliationList,
  addComment,
  getAuditLogs,
} from '../controllers/reconciliation.controller';
import { authenticate, requireOneOfRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', getReconciliationList);
router.post('/', createReconciliation);
router.get('/:id', getReconciliation);
router.put('/:id', updateReconciliation);
router.post('/:id/submit', submitReconciliation);
router.post('/:id/approve', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.FINANCE, Role.ADMIN), approveReconciliation);
router.post('/:id/reject', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.FINANCE, Role.ADMIN), rejectReconciliation);
router.post('/:id/revise', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.FINANCE, Role.ADMIN), requestRevise);
router.post('/:id/comments', addComment);
router.get('/:id/audit-logs', getAuditLogs);

export default router;
