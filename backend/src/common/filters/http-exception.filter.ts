import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  success: boolean;
  errorCode: number;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: ErrorResponse = {
      success: false,
      errorCode: typeof exceptionResponse === 'object' && (exceptionResponse as any).errorCode 
        ? (exceptionResponse as any).errorCode 
        : status,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || 'Internal Server Error',
      details: typeof exceptionResponse === 'object' ? (exceptionResponse as any).details || exceptionResponse : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}

export class BusinessException extends HttpException {
  constructor(errorCode: ErrorCode | number, message: string, details?: any) {
    super(
      {
        errorCode,
        message,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export enum ErrorCode {
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
  OPERATION_NOT_ALLOWED = 1013,
}

export const ErrorMessages: Record<ErrorCode, string> = {
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
