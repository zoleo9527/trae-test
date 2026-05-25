const scheduleService = require('../services/scheduleService');
const { success, paginated } = require('../utils/response');

const createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, schedule, 'Schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(id);
    success(res, schedule);
  } catch (error) {
    next(error);
  }
};

const getSchedules = async (req, res, next) => {
  try {
    const { page, pageSize, status, venue, startDate, endDate } = req.query;

    const filters = { status, venue, startDate, endDate };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { schedules, total } = await scheduleService.getSchedules(filters, pagination);

    paginated(res, schedules, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.updateSchedule(id, req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, schedule, 'Schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, changeReason } = req.body;
    const schedule = await scheduleService.changeStatus(id, status, changeReason, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, schedule, 'Status changed successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await scheduleService.deleteSchedule(id, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, result, 'Schedule deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await scheduleService.getStatusHistory(id);
    success(res, history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSchedule,
  getSchedule,
  getSchedules,
  updateSchedule,
  changeStatus,
  deleteSchedule,
  getStatusHistory,
};
