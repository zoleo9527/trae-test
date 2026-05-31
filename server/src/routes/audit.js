import express from 'express';
import auditService from '../services/auditService.js';
import { success, error } from '../utils/response.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.use(requireRoles('OWNER'));

router.get('/', async (req, res) => {
  try {
    const { entityType, entityId, action, operatorId, startDate, endDate, page, pageSize } = req.query;
    const result = await auditService.getLogs({
      entityType,
      entityId,
      action,
      operatorId,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
    success(res, result);
  } catch (err) {
    error(res, err.message);
  }
});

export default router;
