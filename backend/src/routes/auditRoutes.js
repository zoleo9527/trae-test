const express = require('express');
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorize');
const { Permissions } = require('../utils/permissions');

const router = express.Router();

router.get(
  '/',
  auth,
  requirePermission(Permissions.AUDIT_LOG_VIEW),
  auditController.getAuditLogs
);

router.get(
  '/:entityType/:entityId',
  auth,
  requirePermission(Permissions.AUDIT_LOG_VIEW),
  auditController.getEntityAuditTrail
);

module.exports = router;
