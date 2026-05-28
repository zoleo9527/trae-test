import { Router } from 'express';
import auditService from '../services/auditService.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', requireRole('AGENT_MANAGER'), async (req, res, next) => {
  try {
    const filters = {
      entityType: req.query.entityType,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    };
    const result = await auditService.getUserActivity(req.query.userId || req.user.id, { ...filters, ...options });
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', requireRole('AGENT_MANAGER'), async (req, res, next) => {
  try {
    const summary = await auditService.getAuditSummary({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
    });
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/entity/:entityType/:entityId', async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    };
    const result = await auditService.getEntityHistory(req.params.entityType, req.params.entityId, options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
