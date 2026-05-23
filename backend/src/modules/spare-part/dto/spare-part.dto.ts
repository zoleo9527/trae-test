import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PartRequestStatus } from '../../../entities/part-usage.entity';

export class CreateSparePartDto {
  @IsString()
  partCode: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSparePartDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class QuerySparePartDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  partCode?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;
}

export class CreatePartUsageDto {
  @IsUUID()
  workOrderId: string;

  @IsUUID()
  sparePartId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  requestReason?: string;

  @IsOptional()
  @IsUUID()
  requestedById?: string;
}

export class ApprovePartUsageDto {
  @IsUUID()
  approvedById: string;

  @IsOptional()
  @IsString()
  approvalRemark?: string;

  @IsEnum(PartRequestStatus)
  status: PartRequestStatus.APPROVED | PartRequestStatus.REJECTED;
}

export class ReceivePartUsageDto {
  @IsUUID()
  receivedById: string;
}

export class QueryPartUsageDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsEnum(PartRequestStatus)
  status?: PartRequestStatus;

  @IsOptional()
  @IsUUID()
  sparePartId?: string;
}
