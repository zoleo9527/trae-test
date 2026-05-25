const yup = require('yup');

const OrderStatus = ['PENDING', 'CONFIRMED', 'PAID', 'REFUND_REQUESTED', 'REFUND_APPROVED', 'REFUND_REJECTED', 'COMPLETED', 'CANCELLED'];

const createOrderSchema = yup.object({
  scheduleId: yup.string().required('Schedule ID is required'),
  groupName: yup.string().required('Group name is required').max(200),
  contactPerson: yup.string().required('Contact person is required').max(100),
  contactPhone: yup.string().required('Contact phone is required').max(20),
  ticketCount: yup.number().integer().min(1).required('Ticket count is required'),
  unitPrice: yup.number().positive().required('Unit price is required'),
  totalAmount: yup.number().positive().required('Total amount is required'),
});

const updateOrderSchema = yup.object({
  groupName: yup.string().max(200),
  contactPerson: yup.string().max(100),
  contactPhone: yup.string().max(20),
  ticketCount: yup.number().integer().min(1),
  unitPrice: yup.number().positive(),
  totalAmount: yup.number().positive(),
  actualPaid: yup.number().positive().nullable(),
});

const approveOrderSchema = yup.object({
  changeReason: yup.string().nullable().max(500),
});

const rejectOrderSchema = yup.object({
  rejectReason: yup.string().required('Reject reason is required').max(500),
});

const refundRequestSchema = yup.object({
  refundReason: yup.string().required('Refund reason is required').max(500),
  refundAmount: yup.number().positive().required('Refund amount is required'),
});

const refundApproveSchema = yup.object({
  changeReason: yup.string().nullable().max(500),
});

const refundRejectSchema = yup.object({
  rejectReason: yup.string().required('Reject reason is required').max(500),
});

const markPaidSchema = yup.object({
  actualPaid: yup.number().positive().required('Actual paid amount is required'),
});

const orderFilterSchema = yup.object({
  status: yup.string().oneOf(OrderStatus).nullable(),
  scheduleId: yup.string().nullable(),
  createdById: yup.string().nullable(),
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  approveOrderSchema,
  rejectOrderSchema,
  refundRequestSchema,
  refundApproveSchema,
  refundRejectSchema,
  markPaidSchema,
  orderFilterSchema,
};
