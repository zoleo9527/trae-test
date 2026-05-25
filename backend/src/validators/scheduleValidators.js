const yup = require('yup');

const ScheduleStatus = ['DRAFT', 'CONFIRMED', 'PERFORMING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];

const createScheduleSchema = yup.object({
  performanceName: yup.string().required('Performance name is required').max(200),
  performanceType: yup.string().nullable().max(100),
  startTime: yup.date().required('Start time is required'),
  endTime: yup.date().required('End time is required').min(yup.ref('startTime'), 'End time must be after start time'),
  venue: yup.string().required('Venue is required').max(200),
  castList: yup.string().nullable(),
  description: yup.string().nullable(),
});

const updateScheduleSchema = yup.object({
  performanceName: yup.string().max(200),
  performanceType: yup.string().nullable().max(100),
  startTime: yup.date(),
  endTime: yup.date().min(yup.ref('startTime'), 'End time must be after start time'),
  venue: yup.string().max(200),
  castList: yup.string().nullable(),
  description: yup.string().nullable(),
});

const changeStatusSchema = yup.object({
  status: yup.string().oneOf(ScheduleStatus, 'Invalid status').required('Status is required'),
  changeReason: yup.string().nullable().max(500),
});

const scheduleFilterSchema = yup.object({
  status: yup.string().oneOf(ScheduleStatus).nullable(),
  venue: yup.string().nullable(),
  startDate: yup.date().nullable(),
  endDate: yup.date().nullable(),
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createScheduleSchema,
  updateScheduleSchema,
  changeStatusSchema,
  scheduleFilterSchema,
};
