import { IsEnum, IsUUID, IsString, IsOptional, IsNumber } from 'class-validator';
import { RefundStatus } from '../../../common/enums/refund-status.enum';

export class UpdateRefundStatusDto {
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @IsOptional()
  @IsUUID()
  reviewerId?: string;
}
