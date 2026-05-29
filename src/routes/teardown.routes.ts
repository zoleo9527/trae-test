import { Router } from 'express';
import {
  createTeardown,
  updateTeardown,
  startProgress,
  markMaterialsReturned,
  markSiteCleared,
  completeTeardown,
  getTeardown,
  getTeardownList,
  addComment,
  getAuditLogs,
} from '../controllers/teardown.controller';
import { authenticate, requireOneOfRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', getTeardownList);
router.post('/', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.ADMIN), createTeardown);
router.get('/:id', getTeardown);
router.put('/:id', updateTeardown);
router.post('/:id/start', startProgress);
router.post('/:id/materials-returned', markMaterialsReturned);
router.post('/:id/site-cleared', markSiteCleared);
router.post('/:id/complete', requireOneOfRoles(Role.PROJECT_COORDINATOR, Role.ADMIN), completeTeardown);
router.post('/:id/comments', addComment);
router.get('/:id/audit-logs', getAuditLogs);

export default router;
