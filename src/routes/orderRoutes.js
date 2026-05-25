import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  requestRefund,
  processRefund,
  processSettlement
} from '../services/orderService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ROLES } from '../data/models.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(ROLES.THEATER_MANAGER, ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      performanceId: req.query.performanceId,
      chainId: req.query.chainId
    };
    const orders = getAllOrders(filters);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticateToken, requireRole(ROLES.THEATER_MANAGER, ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, requireRole(ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const order = createOrder(req.body, req.user.id);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, requireRole(ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const order = updateOrder(req.params.id, req.body, req.user.id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticateToken, requireRole(ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const order = updateOrderStatus(req.params.id, req.body.status, req.user.id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/refund-request', authenticateToken, requireRole(ROLES.THEATER_MANAGER, ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const { refundAmount, refundReason, ticketCount } = req.body;
    const task = requestRefund(req.params.id, refundAmount, refundReason, ticketCount, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/refund/:taskId/process', authenticateToken, requireRole(ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const { approved, remark } = req.body;
    const result = processRefund(req.params.taskId, approved, remark, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/settlement', authenticateToken, requireRole(ROLES.TICKET_SUPERVISOR), (req, res) => {
  try {
    const task = processSettlement(req.params.id, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
