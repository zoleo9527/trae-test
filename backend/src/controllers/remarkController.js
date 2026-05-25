const remarkService = require('../services/remarkService');
const { success } = require('../utils/response');

const addRemark = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { content, isSupplement } = req.body;

    const remark = await remarkService.addRemark({
      entityType,
      entityId,
      content,
      isSupplement,
      userId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });

    success(res, remark, 'Remark added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getRemarks = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const remarks = await remarkService.getRemarks(entityType, entityId);
    success(res, remarks);
  } catch (error) {
    next(error);
  }
};

const deleteRemark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await remarkService.deleteRemark(id, req.user.id);
    success(res, result, 'Remark deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addRemark,
  getRemarks,
  deleteRemark,
};
