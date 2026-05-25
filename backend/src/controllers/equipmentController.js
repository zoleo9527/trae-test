const equipmentService = require('../services/equipmentService');
const { success, paginated } = require('../utils/response');

const createEquipment = async (req, res, next) => {
  try {
    const equipment = await equipmentService.createEquipment(req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, equipment, 'Equipment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await equipmentService.getEquipmentById(id);
    success(res, equipment);
  } catch (error) {
    next(error);
  }
};

const getEquipments = async (req, res, next) => {
  try {
    const { page, pageSize, category, isActive } = req.query;

    const filters = { category, isActive: isActive !== undefined ? isActive === 'true' : undefined };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { equipments, total } = await equipmentService.getEquipments(filters, pagination);

    paginated(res, equipments, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await equipmentService.updateEquipment(id, req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, equipment, 'Equipment updated successfully');
  } catch (error) {
    next(error);
  }
};

const createBorrowRequest = async (req, res, next) => {
  try {
    const borrow = await equipmentService.createBorrowRequest(req.body, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, borrow, 'Borrow request created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const borrow = await equipmentService.getBorrowById(id);
    success(res, borrow);
  } catch (error) {
    next(error);
  }
};

const getBorrows = async (req, res, next) => {
  try {
    const { page, pageSize, status, scheduleId, equipmentId, requestedById } = req.query;

    const filters = { status, scheduleId, equipmentId, requestedById };
    const pagination = { page: page || 1, pageSize: pageSize || 20 };

    const { borrows, total } = await equipmentService.getBorrows(filters, pagination);

    paginated(res, borrows, page || 1, pageSize || 20, total);
  } catch (error) {
    next(error);
  }
};

const approveBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplementNote } = req.body;
    const borrow = await equipmentService.approveBorrow(id, supplementNote, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, borrow, 'Borrow request approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;
    const borrow = await equipmentService.rejectBorrow(id, rejectReason, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, borrow, 'Borrow request rejected successfully');
  } catch (error) {
    next(error);
  }
};

const markAsBorrowed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const borrow = await equipmentService.markAsBorrowed(id, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, borrow, 'Equipment marked as borrowed successfully');
  } catch (error) {
    next(error);
  }
};

const returnBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualReturnDate } = req.body;
    const borrow = await equipmentService.returnBorrow(id, actualReturnDate, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, borrow, 'Equipment returned successfully');
  } catch (error) {
    next(error);
  }
};

const supplementBorrow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplementNote } = req.body;
    const borrow = await equipmentService.supplementBorrow(id, supplementNote, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
    success(res, borrow, 'Supplement note added successfully');
  } catch (error) {
    next(error);
  }
};

const getBorrowStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await equipmentService.getBorrowStatusHistory(id);
    success(res, history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEquipment,
  getEquipment,
  getEquipments,
  updateEquipment,
  createBorrowRequest,
  getBorrow,
  getBorrows,
  approveBorrow,
  rejectBorrow,
  markAsBorrowed,
  returnBorrow,
  supplementBorrow,
  getBorrowStatusHistory,
};
