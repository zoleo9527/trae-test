"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const business_error_1 = require("../errors/business-error");
let BusinessExceptionFilter = class BusinessExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const statusMap = {
            [business_error_1.ErrorCode.STUDENT_NOT_FOUND]: common_1.HttpStatus.NOT_FOUND,
            [business_error_1.ErrorCode.WORK_ORDER_NOT_FOUND]: common_1.HttpStatus.NOT_FOUND,
            [business_error_1.ErrorCode.REFUND_NOT_FOUND]: common_1.HttpStatus.NOT_FOUND,
            [business_error_1.ErrorCode.TRANSFER_NOT_FOUND]: common_1.HttpStatus.NOT_FOUND,
            [business_error_1.ErrorCode.MATERIAL_NOT_FOUND]: common_1.HttpStatus.NOT_FOUND,
            [business_error_1.ErrorCode.AUDIT_LOG_NOT_FOUND]: common_1.HttpStatus.NOT_FOUND,
            [business_error_1.ErrorCode.INVALID_STATE_TRANSITION]: common_1.HttpStatus.BAD_REQUEST,
            [business_error_1.ErrorCode.INVALID_ROLE]: common_1.HttpStatus.BAD_REQUEST,
            [business_error_1.ErrorCode.PERMISSION_DENIED]: common_1.HttpStatus.FORBIDDEN,
            [business_error_1.ErrorCode.DUPLICATE_RECORD]: common_1.HttpStatus.CONFLICT,
            [business_error_1.ErrorCode.MATERIAL_VERSION_CONFLICT]: common_1.HttpStatus.CONFLICT,
            [business_error_1.ErrorCode.DEADLINE_MISSED]: common_1.HttpStatus.BAD_REQUEST,
            [business_error_1.ErrorCode.INSUFFICIENT_CONTEXT]: common_1.HttpStatus.BAD_REQUEST,
            [business_error_1.ErrorCode.VALIDATION_ERROR]: common_1.HttpStatus.BAD_REQUEST,
            [business_error_1.ErrorCode.INTERNAL_ERROR]: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        };
        const status = statusMap[exception.code] || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(status).json({
            success: false,
            error: exception.toJSON(),
        });
    }
};
exports.BusinessExceptionFilter = BusinessExceptionFilter;
exports.BusinessExceptionFilter = BusinessExceptionFilter = __decorate([
    (0, common_1.Catch)(business_error_1.BusinessError)
], BusinessExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map