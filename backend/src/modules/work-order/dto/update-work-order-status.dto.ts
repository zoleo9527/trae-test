import { IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus)
  status: WorkOrderStatus;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
