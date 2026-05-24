import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BusinessError, ErrorCode } from '../errors/business-error';

@Catch(BusinessError)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusMap: Record<ErrorCode, number> = {
      [ErrorCode.STUDENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.WORK_ORDER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.REFUND_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.TRANSFER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.MATERIAL_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.AUDIT_LOG_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.INVALID_STATE_TRANSITION]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_ROLE]: HttpStatus.BAD_REQUEST,
      [ErrorCode.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
      [ErrorCode.DUPLICATE_RECORD]: HttpStatus.CONFLICT,
      [ErrorCode.MATERIAL_VERSION_CONFLICT]: HttpStatus.CONFLICT,
      [ErrorCode.DEADLINE_MISSED]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INSUFFICIENT_CONTEXT]: HttpStatus.BAD_REQUEST,
      [ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    const status = statusMap[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      success: false,
      error: exception.toJSON(),
    });
  }
}
