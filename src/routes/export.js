import { Router } from 'express';
import exportService from '../services/exportService.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/berthing-plans', requireRole('AGENT_MANAGER'), async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      portId: req.query.portId,
    };
    const format = req.query.format || 'csv';
    const data = await exportService.exportBerthingPlans(filters, req.user.id, format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="berthing-plans-${Date.now()}.csv`);
      res.send('\uFEFF' + data);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/documents', requireRole('AGENT_MANAGER', 'DOCUMENT_SPECIALIST'), async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      expiryWarning: req.query.expiryWarning === 'true',
    };
    const format = req.query.format || 'csv';
    const data = await exportService.exportDocuments(filters, req.user.id, format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="documents-${Date.now()}.csv`);
      res.send('\uFEFF' + data);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/fees', requireRole('AGENT_MANAGER', 'FINANCE_OFFICER'), async (req, res, next) => {
  try {
    const filters = {
      isPaid: req.query.isPaid === 'true',
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      berthingPlanId: req.query.berthingPlanId,
    };
    const format = req.query.format || 'csv';
    const data = await exportService.exportFees(filters, req.user.id, format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="fees-${Date.now()}.csv`);
      res.send('\uFEFF' + data);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', requireRole('AGENT_MANAGER'), async (req, res, next) => {
  try {
    const filters = {
      entityType: req.query.entityType,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      targetUserId: req.query.userId,
    };
    const format = req.query.format || 'csv';
    const data = await exportService.exportAuditLogs(filters, req.user.id, format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv`);
      res.send('\uFEFF' + data);
    } else {
      res.json({ success: true, data });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
