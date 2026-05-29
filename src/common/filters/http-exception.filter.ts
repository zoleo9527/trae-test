import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export class BusinessException extends HttpException {
  code: string;

  constructor(message: string, code: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
    this.code = code;
  }
}

export enum ErrorCode {
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  CREDENTIAL_EXPIRED = 'CREDENTIAL_EXPIRED',
  MATERIAL_VERSION_CONFLICT = 'MATERIAL_VERSION_CONFLICT',
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let code = 'UNKNOWN_ERROR';

    if (exception instanceof BusinessException) {
      code = exception.code;
    }

    if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || message;
    }

    this.logger.error(`Exception: ${code} - ${message}`);

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details: exceptionResponse,
      },
      timestamp: Date.now(),
    });
  }
}
