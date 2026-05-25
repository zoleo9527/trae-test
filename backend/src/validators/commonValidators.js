const yup = require('yup');

const paginationSchema = yup.object({
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

const idParamSchema = yup.object({
  id: yup.string().required('ID is required'),
});

const remarkSchema = yup.object({
  content: yup.string().required('Content is required').max(2000, 'Content too long'),
  isSupplement: yup.boolean().default(false),
});

const dateRangeSchema = yup.object({
  startDate: yup.date().nullable(),
  endDate: yup.date().nullable(),
});

module.exports = {
  paginationSchema,
  idParamSchema,
  remarkSchema,
  dateRangeSchema,
};
