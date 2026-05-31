import express from 'express';
import refundService from '../services/refundService.js';
import { success, error } from '../utils/response.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, page, pageSize } = req.query;
    const result = await refundService.getRefunds({
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
    const refund = await refundService.getRefundDetail(req.params.id);
    success(res, refund);
  } catch (err) {
    error(res, err.message, 404);
  }
});

router.post('/', requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const refund = await refundService.createRefund(
      req.body,
      req.user.id,
      req.ip,
      requestId
    );
    success(res, refund, '退款申请创建成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/approve', requireRoles('OWNER'), async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const refund = await refundService.approveRefund(
      req.params.id,
      req.user.id,
      req.ip,
      requestId
    );
    success(res, refund, '退款批准成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/reject', requireRoles('OWNER'), async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const refund = await refundService.rejectRefund(
      req.params.id,
      req.user.id,
      req.ip,
      requestId
    );
    success(res, refund, '退款驳回成功');
  } catch (err) {
    error(res, err.message);
  }
});

router.post('/:id/complete', requireRoles('OWNER', 'CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const refund = await refundService.completeRefund(
      req.params.id,
      req.user.id,
      req.ip,
      requestId
    );
    success(res, refund, '退款完成成功');
  } catch (err) {
    error(res, err.message);
  }
});

export default router;
