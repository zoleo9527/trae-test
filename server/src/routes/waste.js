import express from 'express';
import wasteService from '../services/wasteService.js';
import { success, error } from '../utils/response.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { reason, startDate, endDate, materialId, productionId, orderId, page, pageSize } = req.query;
    const result = await wasteService.getWasteRecords({
      reason,
      startDate,
      endDate,
      materialId,
      productionId,
      orderId,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
    success(res, result);
  } catch (err) {
    error(res, err.message);
  }
});

router.get('/analysis', async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const analysis = await wasteService.getWasteAnalysis({
      startDate,
      endDate,
      groupBy,
    });
    success(res, analysis);
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const record = await wasteService.createWasteRecord(
      req.body,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, record, '损耗记录创建成功');
  } catch (err) {
    error(res, err.message);
  }
});

export default router;
