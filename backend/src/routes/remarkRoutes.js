const express = require('express');
const remarkController = require('../controllers/remarkController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/authorize');
const { remarkSchema, idParamSchema } = require('../validators/commonValidators');
const { Permissions } = require('../utils/permissions');

const router = express.Router();

router.post(
  '/:entityType/:entityId',
  auth,
  requirePermission(Permissions.REMARK_ADD),
  validate(remarkSchema),
  remarkController.addRemark
);

router.get(
  '/:entityType/:entityId',
  auth,
  remarkController.getRemarks
);

router.delete(
  '/:id',
  auth,
  validate(idParamSchema, 'params'),
  remarkController.deleteRemark
);

module.exports = router;
