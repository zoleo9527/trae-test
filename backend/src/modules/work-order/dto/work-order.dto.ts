import { IsEnum, IsString, IsOptional, IsUUID, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkOrderStatus, AbnormalType } from '../../../common/enums/work-order.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateWorkOrderDto {
  @IsString()
  title: string;

  @IsEnum(AbnormalType)
  abnormalType: AbnormalType;

  @IsString()
  station: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  equipmentNo?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsNumber()
  powerLoss?: number;
}

export class QueryWorkOrderDto extends PaginationDto {
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsEnum(AbnormalType)
  abnormalType?: AbnormalType;

  @IsOptional()
  @IsString()
  station?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  handlerId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class TransitionStatusDto {
  @IsEnum(WorkOrderStatus)
  targetStatus: WorkOrderStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;
}

export class AssignHandlerDto {
  @IsUUID()
  handlerId: string;
}
