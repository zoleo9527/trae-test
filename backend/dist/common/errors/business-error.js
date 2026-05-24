"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.BusinessError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["STUDENT_NOT_FOUND"] = "STUDENT_NOT_FOUND";
    ErrorCode["WORK_ORDER_NOT_FOUND"] = "WORK_ORDER_NOT_FOUND";
    ErrorCode["REFUND_NOT_FOUND"] = "REFUND_NOT_FOUND";
    ErrorCode["TRANSFER_NOT_FOUND"] = "TRANSFER_NOT_FOUND";
    ErrorCode["MATERIAL_NOT_FOUND"] = "MATERIAL_NOT_FOUND";
    ErrorCode["DEADLINE_NOT_FOUND"] = "DEADLINE_NOT_FOUND";
    ErrorCode["COMMENT_NOT_FOUND"] = "COMMENT_NOT_FOUND";
    ErrorCode["AUDIT_LOG_NOT_FOUND"] = "AUDIT_LOG_NOT_FOUND";
    ErrorCode["INVALID_STATE_TRANSITION"] = "INVALID_STATE_TRANSITION";
    ErrorCode["INVALID_ROLE"] = "INVALID_ROLE";
    ErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    ErrorCode["DUPLICATE_RECORD"] = "DUPLICATE_RECORD";
    ErrorCode["MATERIAL_VERSION_CONFLICT"] = "MATERIAL_VERSION_CONFLICT";
    ErrorCode["DEADLINE_MISSED"] = "DEADLINE_MISSED";
    ErrorCode["INSUFFICIENT_CONTEXT"] = "INSUFFICIENT_CONTEXT";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class BusinessError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'BusinessError';
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}
exports.BusinessError = BusinessError;
const createError = (code, message, details) => {
    return new BusinessError(code, message, details);
};
exports.createError = createError;
//# sourceMappingURL=business-error.js.map