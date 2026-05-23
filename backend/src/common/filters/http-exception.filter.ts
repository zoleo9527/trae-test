import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  code: number;
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
      code: status,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || 'Internal Server Error',
      details: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}

export class BusinessException extends HttpException {
  constructor(message: string, code: number = HttpStatus.BAD_REQUEST) {
    super(message, code);
  }
}

export enum ErrorCode {
  WORK_ORDER_NOT_FOUND = 1001,
  INVALID_STATUS_TRANSITION = 1002,
  INSUFFICIENT_PERMISSION = 1003,
  PART_NOT_FOUND = 1004,
  INSUFFICIENT_STOCK = 1005,
  DOWNTIME_NOT_FOUND = 1006,
  REVIEW_NOT_FOUND = 1007,
  USER_NOT_FOUND = 1008,
  VALIDATION_ERROR = 1009,
}
