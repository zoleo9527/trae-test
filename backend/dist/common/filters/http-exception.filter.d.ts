import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { BusinessError } from '../errors/business-error';
export declare class BusinessExceptionFilter implements ExceptionFilter {
    catch(exception: BusinessError, host: ArgumentsHost): void;
}
