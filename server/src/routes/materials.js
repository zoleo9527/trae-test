import express from 'express';
import materialService from '../services/materialService.js';
import { success, error } from '../utils/response.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { category, lowStock, page, pageSize } = req.query;
    const result = await materialService.getMaterials({
      category,
      lowStock: lowStock === 'true',
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 50,
    });
    success(res, result);
  } catch (err) {
    error(res, err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const material = await materialService.getMaterialDetail(req.params.id);
    success(res, material);
  } catch (err) {
    error(res, err.message, 404);
  }
});

router.post('/:id/stock', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const material = await materialService.updateStock(
      req.params.id,
      req.body.quantity,
      req.body.type,
      req.body.reason,
      req.user.id,
      req.ip,
      requestId
    );
    success(res, material, '库存更新成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.get('/inventories', async (req, res) => {
  try {
    const { status, page, pageSize } = req.query;
    const result = await materialService.getInventories({
      status,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
    success(res, result);
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/inventories', requireRoles('OWNER'), async (req, res) => {
  try {
    const inventory = await materialService.createInventory(
      req.body.title,
      req.body.type,
      req.body.materialIds,
      req.user.id
    );
    success(res, inventory, '盘点单创建成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/inventories/:id/start', requireRoles('OWNER'), async (req, res) => {
  try {
    const inventory = await materialService.startInventory(
      req.params.id,
      req.user.id
    );
    success(res, inventory, '开始盘点');
  } catch (err) {
    error(res, err.message);
  }
});

router.put('/inventories/items/:itemId', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const item = await materialService.updateInventoryItem(
      req.params.itemId,
      req.body.actualStock,
      req.body.remark,
      req.user.id
    );
    success(res, item, '盘点项更新成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/inventories/:id/complete', requireRoles('OWNER'), async (req, res) => {
  try {
    const inventory = await materialService.completeInventory(
      req.params.id,
      req.user.id
    );
    success(res, inventory, '盘点完成');
  } catch (err) {
    error(res, err.message);
  }
});

export default router;
