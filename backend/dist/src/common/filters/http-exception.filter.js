"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = exports.ErrorCode = exports.BusinessException = exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const errorResponse = {
            success: false,
            errorCode: typeof exceptionResponse === 'object' && exceptionResponse.errorCode
                ? exceptionResponse.errorCode
                : status,
            message: typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message || 'Internal Server Error',
            details: typeof exceptionResponse === 'object' ? exceptionResponse.details || exceptionResponse : undefined,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        response.status(status).json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
class BusinessException extends common_1.HttpException {
    constructor(errorCode, message, details) {
        super({
            errorCode,
            message,
            details,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.BusinessException = BusinessException;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["SUCCESS"] = 0] = "SUCCESS";
    ErrorCode[ErrorCode["WORK_ORDER_NOT_FOUND"] = 1001] = "WORK_ORDER_NOT_FOUND";
    ErrorCode[ErrorCode["INVALID_STATUS_TRANSITION"] = 1002] = "INVALID_STATUS_TRANSITION";
    ErrorCode[ErrorCode["INSUFFICIENT_PERMISSION"] = 1003] = "INSUFFICIENT_PERMISSION";
    ErrorCode[ErrorCode["PART_NOT_FOUND"] = 1004] = "PART_NOT_FOUND";
    ErrorCode[ErrorCode["INSUFFICIENT_STOCK"] = 1005] = "INSUFFICIENT_STOCK";
    ErrorCode[ErrorCode["DOWNTIME_NOT_FOUND"] = 1006] = "DOWNTIME_NOT_FOUND";
    ErrorCode[ErrorCode["REVIEW_NOT_FOUND"] = 1007] = "REVIEW_NOT_FOUND";
    ErrorCode[ErrorCode["USER_NOT_FOUND"] = 1008] = "USER_NOT_FOUND";
    ErrorCode[ErrorCode["VALIDATION_ERROR"] = 1009] = "VALIDATION_ERROR";
    ErrorCode[ErrorCode["PART_USAGE_NOT_FOUND"] = 1010] = "PART_USAGE_NOT_FOUND";
    ErrorCode[ErrorCode["INVALID_PART_USAGE_STATUS"] = 1011] = "INVALID_PART_USAGE_STATUS";
    ErrorCode[ErrorCode["REVIEW_ALREADY_VERIFIED"] = 1012] = "REVIEW_ALREADY_VERIFIED";
    ErrorCode[ErrorCode["OPERATION_NOT_ALLOWED"] = 1013] = "OPERATION_NOT_ALLOWED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
exports.ErrorMessages = {
    [ErrorCode.SUCCESS]: '操作成功',
    [ErrorCode.WORK_ORDER_NOT_FOUND]: '工单不存在',
    [ErrorCode.INVALID_STATUS_TRANSITION]: '无效的状态流转',
    [ErrorCode.INSUFFICIENT_PERMISSION]: '权限不足',
    [ErrorCode.PART_NOT_FOUND]: '备件不存在',
    [ErrorCode.INSUFFICIENT_STOCK]: '库存不足',
    [ErrorCode.DOWNTIME_NOT_FOUND]: '停机记录不存在',
    [ErrorCode.REVIEW_NOT_FOUND]: '复盘记录不存在',
    [ErrorCode.USER_NOT_FOUND]: '用户不存在',
    [ErrorCode.VALIDATION_ERROR]: '参数验证错误',
    [ErrorCode.PART_USAGE_NOT_FOUND]: '备件领用记录不存在',
    [ErrorCode.INVALID_PART_USAGE_STATUS]: '备件领用状态无效',
    [ErrorCode.REVIEW_ALREADY_VERIFIED]: '复盘已验证',
    [ErrorCode.OPERATION_NOT_ALLOWED]: '当前状态不允许此操作',
};
//# sourceMappingURL=http-exception.filter.js.map