const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/authorize');
const { Permissions } = require('../utils/permissions');
const {
  createScheduleSchema,
  updateScheduleSchema,
  changeStatusSchema,
  scheduleFilterSchema,
} = require('../validators/scheduleValidators');
const { idParamSchema } = require('../validators/commonValidators');

const router = express.Router();

router.get(
  '/',
  auth,
  requirePermission(Permissions.SCHEDULE_VIEW),
  validate(scheduleFilterSchema, 'query'),
  scheduleController.getSchedules
);

router.post(
  '/',
  auth,
  requirePermission(Permissions.SCHEDULE_CREATE),
  validate(createScheduleSchema),
  scheduleController.createSchedule
);

router.get(
  '/:id',
  auth,
  requirePermission(Permissions.SCHEDULE_VIEW),
  validate(idParamSchema, 'params'),
  scheduleController.getSchedule
);

router.put(
  '/:id',
  auth,
  requirePermission(Permissions.SCHEDULE_EDIT),
  validate(idParamSchema, 'params'),
  validate(updateScheduleSchema),
  scheduleController.updateSchedule
);

router.patch(
  '/:id/status',
  auth,
  requirePermission(Permissions.SCHEDULE_STATUS_CHANGE),
  validate(idParamSchema, 'params'),
  validate(changeStatusSchema),
  scheduleController.changeStatus
);

router.delete(
  '/:id',
  auth,
  requirePermission(Permissions.SCHEDULE_DELETE),
  validate(idParamSchema, 'params'),
  scheduleController.deleteSchedule
);

router.get(
  '/:id/status-history',
  auth,
  requirePermission(Permissions.SCHEDULE_VIEW),
  validate(idParamSchema, 'params'),
  scheduleController.getStatusHistory
);

module.exports = router;
