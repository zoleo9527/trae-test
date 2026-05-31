import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ChangeOrderStatus } from '../../common/enums/change-order-status.enum';

export class StatusTransitionDto {
  @IsEnum(ChangeOrderStatus)
  targetStatus: ChangeOrderStatus;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  comments?: string;
}
