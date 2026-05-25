const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/authorize');
const { Permissions } = require('../utils/permissions');
const {
  createEquipmentSchema,
  updateEquipmentSchema,
  createBorrowRequestSchema,
  approveBorrowSchema,
  rejectBorrowSchema,
  returnBorrowSchema,
  supplementBorrowSchema,
  equipmentFilterSchema,
  borrowFilterSchema,
} = require('../validators/equipmentValidators');
const { idParamSchema } = require('../validators/commonValidators');

const router = express.Router();

router.get(
  '/',
  auth,
  requirePermission(Permissions.EQUIPMENT_VIEW),
  validate(equipmentFilterSchema, 'query'),
  equipmentController.getEquipments
);

router.post(
  '/',
  auth,
  requirePermission(Permissions.EQUIPMENT_MANAGE),
  validate(createEquipmentSchema),
  equipmentController.createEquipment
);

router.get(
  '/:id',
  auth,
  requirePermission(Permissions.EQUIPMENT_VIEW),
  validate(idParamSchema, 'params'),
  equipmentController.getEquipment
);

router.put(
  '/:id',
  auth,
  requirePermission(Permissions.EQUIPMENT_MANAGE),
  validate(idParamSchema, 'params'),
  validate(updateEquipmentSchema),
  equipmentController.updateEquipment
);

router.get(
  '/borrows',
  auth,
  requirePermission(Permissions.EQUIPMENT_VIEW),
  validate(borrowFilterSchema, 'query'),
  equipmentController.getBorrows
);

router.post(
  '/borrows',
  auth,
  requirePermission(Permissions.EQUIPMENT_BORROW_REQUEST),
  validate(createBorrowRequestSchema),
  equipmentController.createBorrowRequest
);

router.get(
  '/borrows/:id',
  auth,
  requirePermission(Permissions.EQUIPMENT_VIEW),
  validate(idParamSchema, 'params'),
  equipmentController.getBorrow
);

router.post(
  '/borrows/:id/approve',
  auth,
  requirePermission(Permissions.EQUIPMENT_BORROW_APPROVE),
  validate(idParamSchema, 'params'),
  validate(approveBorrowSchema),
  equipmentController.approveBorrow
);

router.post(
  '/borrows/:id/reject',
  auth,
  requirePermission(Permissions.EQUIPMENT_BORROW_APPROVE),
  validate(idParamSchema, 'params'),
  validate(rejectBorrowSchema),
  equipmentController.rejectBorrow
);

router.post(
  '/borrows/:id/borrowed',
  auth,
  requirePermission(Permissions.EQUIPMENT_BORROW_RETURN),
  validate(idParamSchema, 'params'),
  equipmentController.markAsBorrowed
);

router.post(
  '/borrows/:id/return',
  auth,
  requirePermission(Permissions.EQUIPMENT_BORROW_RETURN),
  validate(idParamSchema, 'params'),
  validate(returnBorrowSchema),
  equipmentController.returnBorrow
);

router.post(
  '/borrows/:id/supplement',
  auth,
  requirePermission(Permissions.EQUIPMENT_BORROW_REQUEST),
  validate(idParamSchema, 'params'),
  validate(supplementBorrowSchema),
  equipmentController.supplementBorrow
);

router.get(
  '/borrows/:id/status-history',
  auth,
  requirePermission(Permissions.EQUIPMENT_VIEW),
  validate(idParamSchema, 'params'),
  equipmentController.getBorrowStatusHistory
);

module.exports = router;
