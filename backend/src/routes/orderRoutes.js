const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/authorize');
const { Permissions } = require('../utils/permissions');
const {
  createOrderSchema,
  updateOrderSchema,
  approveOrderSchema,
  rejectOrderSchema,
  refundRequestSchema,
  refundApproveSchema,
  refundRejectSchema,
  markPaidSchema,
  orderFilterSchema,
} = require('../validators/orderValidators');
const { idParamSchema } = require('../validators/commonValidators');

const router = express.Router();

router.get(
  '/',
  auth,
  requirePermission(Permissions.GROUP_ORDER_VIEW),
  validate(orderFilterSchema, 'query'),
  orderController.getOrders
);

router.post(
  '/',
  auth,
  requirePermission(Permissions.GROUP_ORDER_CREATE),
  validate(createOrderSchema),
  orderController.createOrder
);

router.get(
  '/:id',
  auth,
  requirePermission(Permissions.GROUP_ORDER_VIEW),
  validate(idParamSchema, 'params'),
  orderController.getOrder
);

router.put(
  '/:id',
  auth,
  requirePermission(Permissions.GROUP_ORDER_CREATE),
  validate(idParamSchema, 'params'),
  validate(updateOrderSchema),
  orderController.updateOrder
);

router.post(
  '/:id/approve',
  auth,
  requirePermission(Permissions.GROUP_ORDER_APPROVE),
  validate(idParamSchema, 'params'),
  validate(approveOrderSchema),
  orderController.approveOrder
);

router.post(
  '/:id/reject',
  auth,
  requirePermission(Permissions.GROUP_ORDER_APPROVE),
  validate(idParamSchema, 'params'),
  validate(rejectOrderSchema),
  orderController.rejectOrder
);

router.post(
  '/:id/paid',
  auth,
  requirePermission(Permissions.GROUP_ORDER_APPROVE),
  validate(idParamSchema, 'params'),
  validate(markPaidSchema),
  orderController.markPaid
);

router.post(
  '/:id/refund-request',
  auth,
  requirePermission(Permissions.GROUP_ORDER_REFUND),
  validate(idParamSchema, 'params'),
  validate(refundRequestSchema),
  orderController.requestRefund
);

router.post(
  '/:id/refund-approve',
  auth,
  requirePermission(Permissions.GROUP_ORDER_REFUND),
  validate(idParamSchema, 'params'),
  validate(refundApproveSchema),
  orderController.approveRefund
);

router.post(
  '/:id/refund-reject',
  auth,
  requirePermission(Permissions.GROUP_ORDER_REFUND),
  validate(idParamSchema, 'params'),
  validate(refundRejectSchema),
  orderController.rejectRefund
);

router.get(
  '/:id/status-history',
  auth,
  requirePermission(Permissions.GROUP_ORDER_VIEW),
  validate(idParamSchema, 'params'),
  orderController.getStatusHistory
);

module.exports = router;
