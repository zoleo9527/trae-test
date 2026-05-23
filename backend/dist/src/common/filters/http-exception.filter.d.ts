import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
export interface ErrorResponse {
    success: boolean;
    errorCode: number;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void;
}
export declare class BusinessException extends HttpException {
    constructor(errorCode: ErrorCode | number, message: string, details?: any);
}
export declare enum ErrorCode {
    SUCCESS = 0,
    WORK_ORDER_NOT_FOUND = 1001,
    INVALID_STATUS_TRANSITION = 1002,
    INSUFFICIENT_PERMISSION = 1003,
    PART_NOT_FOUND = 1004,
    INSUFFICIENT_STOCK = 1005,
    DOWNTIME_NOT_FOUND = 1006,
    REVIEW_NOT_FOUND = 1007,
    USER_NOT_FOUND = 1008,
    VALIDATION_ERROR = 1009,
    PART_USAGE_NOT_FOUND = 1010,
    INVALID_PART_USAGE_STATUS = 1011,
    REVIEW_ALREADY_VERIFIED = 1012,
    OPERATION_NOT_ALLOWED = 1013
}
export declare const ErrorMessages: Record<ErrorCode, string>;
