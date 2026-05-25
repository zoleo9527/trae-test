const orderService = require('../services/orderService');
const { success, paginated } = require('../utils/response');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    success(res, order);
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { page, pageSize, status, scheduleId, createdById } = req.query;

    const filters = { status, scheduleId, createdById };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { orders, total } = await orderService.getOrders(filters, pagination);

    paginated(res, orders, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.updateOrder(id, req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Order updated successfully');
  } catch (error) {
    next(error);
  }
};

const approveOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { changeReason } = req.body;
    const order = await orderService.approveOrder(id, changeReason, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Order approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;
    const order = await orderService.rejectOrder(id, rejectReason, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Order rejected successfully');
  } catch (error) {
    next(error);
  }
};

const markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualPaid } = req.body;
    const order = await orderService.markPaid(id, actualPaid, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Order marked as paid successfully');
  } catch (error) {
    next(error);
  }
};

const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundReason, refundAmount } = req.body;
    const order = await orderService.requestRefund(id, refundReason, refundAmount, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Refund requested successfully');
  } catch (error) {
    next(error);
  }
};

const approveRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { changeReason } = req.body;
    const order = await orderService.approveRefund(id, changeReason, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Refund approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;
    const order = await orderService.rejectRefund(id, rejectReason, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, order, 'Refund rejected successfully');
  } catch (error) {
    next(error);
  }
};

const getStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await orderService.getStatusHistory(id);
    success(res, history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrder,
  getOrders,
  updateOrder,
  approveOrder,
  rejectOrder,
  markPaid,
  requestRefund,
  approveRefund,
  rejectRefund,
  getStatusHistory,
};
