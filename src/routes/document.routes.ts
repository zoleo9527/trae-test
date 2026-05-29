import { Router } from 'express';
import {
  createDocument,
  updateDocument,
  startProgress,
  submitDocument,
  approveDocument,
  rejectDocument,
  getDocument,
  getDocumentList,
  addComment,
  getAuditLogs,
} from '../controllers/document.controller';
import { authenticate, requireOneOfRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', getDocumentList);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.post('/:id/start', startProgress);
router.post('/:id/submit', submitDocument);
router.post('/:id/approve', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.ADMIN), approveDocument);
router.post('/:id/reject', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.ADMIN), rejectDocument);
router.post('/:id/comments', addComment);
router.get('/:id/audit-logs', getAuditLogs);

export default router;
