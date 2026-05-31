import express from 'express';
import productionService from '../services/productionService.js';
import { success, error } from '../utils/response.js';
import { auth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, page, pageSize } = req.query;
    const result = await productionService.getProductions({
      status,
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

router.get('/schedule', async (req, res) => {
  try {
    const { date } = req.query;
    const schedule = await productionService.getProductionSchedule(date || new Date().toISOString());
    success(res, schedule);
  } catch (err) {
    error(res, err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const production = await productionService.getProductionDetail(req.params.id);
    success(res, production);
  } catch (err) {
    error(res, err.message, 404);
  }
});

router.post('/', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const production = await productionService.createProduction(
      req.body.orderId,
      req.body.scheduledDate,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, production, '生产排期创建成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/start', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const production = await productionService.startProduction(
      req.params.id,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, production, '开始生产成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/complete', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const production = await productionService.completeProduction(
      req.params.id,
      req.body.yieldQuantity,
      req.body.defectiveQuantity,
      req.body.remark,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, production, '生产完成成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/rework', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const production = await productionService.reworkProduction(
      req.params.id,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, production, '返工安排成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/notes', async (req, res) => {
  try {
    const note = await productionService.addNote(
      req.params.id,
      req.body.content,
      req.body.type || 'GENERAL',
      req.user.id
    );
    success(res, note, '备注添加成功');
  } catch (err) {
    error(res, err.message);
  }
});

export default router;
