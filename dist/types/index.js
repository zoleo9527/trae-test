"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = exports.ReturnStatus = exports.BorrowStatus = exports.Role = void 0;
exports.Role = {
    SALES_CONSULTANT: 'SALES_CONSULTANT',
    SHOWROOM_MANAGER: 'SHOWROOM_MANAGER',
    INSTALL_COORDINATOR: 'INSTALL_COORDINATOR',
};
exports.BorrowStatus = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    BORROWED: 'BORROWED',
    RETURNING: 'RETURNING',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
};
exports.ReturnStatus = {
    PENDING_INSPECTION: 'PENDING_INSPECTION',
    INSPECTION_PASSED: 'INSPECTION_PASSED',
    NEEDS_REVIEW: 'NEEDS_REVIEW',
    COMPLETED: 'COMPLETED',
};
exports.AuditAction = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
    BORROW: 'BORROW',
    RETURN: 'RETURN',
    INSPECT: 'INSPECT',
    REASSIGN: 'REASSIGN',
    COMMENT: 'COMMENT',
};
//# sourceMappingURL=index.js.map