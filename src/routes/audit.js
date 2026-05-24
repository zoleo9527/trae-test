import express from 'express';
import auditService from '../services/auditService.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/',
  requirePermission('audit:view'),
  (req, res) => {
    const logs = auditService.searchLogs(req.query, req.query.limit || 100);
    res.json({ data: logs });
  }
);

router.get('/module/:module',
  requirePermission('audit:view'),
  (req, res) => {
    const logs = auditService.getLogsByModule(req.params.module, req.query.limit || 100);
    res.json({ data: logs });
  }
);

router.get('/module/:module/:refId',
  requirePermission('audit:view'),
  (req, res) => {
    const logs = auditService.getLogsByRef(req.params.module, req.params.refId, req.query.limit || 100);
    res.json({ data: logs });
  }
);

router.get('/user/:userId',
  requirePermission('audit:view'),
  (req, res) => {
    const logs = auditService.getLogsByUser(req.params.userId, req.query.limit || 100);
    res.json({ data: logs });
  }
);

export default router;
