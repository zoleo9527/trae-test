import express from 'express';
import orderService from '../services/orderService.js';
import { success, error } from '../utils/response.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { idempotency } from '../middleware/idempotency.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, page, pageSize } = req.query;
    const result = await orderService.getOrders({
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

router.get('/:id', async (req, res) => {
  try {
    const order = await orderService.getOrderDetail(req.params.id);
    success(res, order);
  } catch (err) {
    error(res, err.message, 404);
  }
});

router.post('/', idempotency, requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const order = await orderService.createOrder(
      req.body,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '订单创建成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.put('/:id', requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const order = await orderService.updateOrder(
      req.params.id,
      req.body,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '订单更新成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/confirm', requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const order = await orderService.confirmOrder(
      req.params.id,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '订单确认成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/reject', requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const order = await orderService.rejectOrder(
      req.params.id,
      req.body.rejectReason,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '订单驳回成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/start-production', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const order = await orderService.startProduction(
      req.params.id,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '开始生产成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/complete', requireRoles('OWNER', 'KITCHEN'), async (req, res) => {
  try {
    const order = await orderService.completeOrder(
      req.params.id,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '订单完成成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/cancel', requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user.id,
      req.ip,
      req.requestId
    );
    success(res, order, '订单取消成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/notes', async (req, res) => {
  try {
    const note = await orderService.addNote(
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
