const yup = require('yup');

const BorrowStatus = ['PENDING', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURNED', 'OVERDUE'];

const createEquipmentSchema = yup.object({
  name: yup.string().required('Equipment name is required').max(200),
  category: yup.string().required('Category is required').max(100),
  specification: yup.string().nullable(),
  quantity: yup.number().integer().min(1).required('Quantity is required'),
  location: yup.string().nullable().max(200),
  description: yup.string().nullable(),
});

const updateEquipmentSchema = yup.object({
  name: yup.string().max(200),
  category: yup.string().max(100),
  specification: yup.string().nullable(),
  quantity: yup.number().integer().min(1),
  availableQty: yup.number().integer().min(0),
  location: yup.string().nullable().max(200),
  description: yup.string().nullable(),
  isActive: yup.boolean(),
});

const createBorrowRequestSchema = yup.object({
  scheduleId: yup.string().required('Schedule ID is required'),
  equipmentId: yup.string().required('Equipment ID is required'),
  borrowQty: yup.number().integer().min(1).required('Borrow quantity is required'),
  requestReason: yup.string().required('Request reason is required').max(500),
  expectedReturnDate: yup.date().required('Expected return date is required'),
});

const approveBorrowSchema = yup.object({
  supplementNote: yup.string().nullable().max(500),
});

const rejectBorrowSchema = yup.object({
  rejectReason: yup.string().required('Reject reason is required').max(500),
});

const returnBorrowSchema = yup.object({
  actualReturnDate: yup.date().default(() => new Date()),
});

const supplementBorrowSchema = yup.object({
  supplementNote: yup.string().required('Supplement note is required').max(1000),
});

const equipmentFilterSchema = yup.object({
  category: yup.string().nullable(),
  isActive: yup.boolean().nullable(),
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

const borrowFilterSchema = yup.object({
  status: yup.string().oneOf(BorrowStatus).nullable(),
  scheduleId: yup.string().nullable(),
  equipmentId: yup.string().nullable(),
  requestedById: yup.string().nullable(),
  page: yup.number().integer().min(1).default(1),
  pageSize: yup.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createEquipmentSchema,
  updateEquipmentSchema,
  createBorrowRequestSchema,
  approveBorrowSchema,
  rejectBorrowSchema,
  returnBorrowSchema,
  supplementBorrowSchema,
  equipmentFilterSchema,
  borrowFilterSchema,
};
