import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { RefundStatus } from '../../../common/enums/refund-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryRefundDto extends PaginationDto {
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsUUID()
  initiatorId?: string;
}
