const auditService = require('../services/auditService');
const { success, paginated } = require('../utils/response');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, pageSize, userId, action, entityType, entityId, startDate, endDate } = req.query;

    const filters = { userId, action, entityType, entityId, startDate, endDate };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { logs, total } = await auditService.getAuditLogs(filters, pagination);

    paginated(res, logs, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const getEntityAuditTrail = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await auditService.getEntityAuditTrail(entityType, entityId);
    success(res, logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getEntityAuditTrail,
};
