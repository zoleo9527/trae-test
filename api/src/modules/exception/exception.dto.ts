import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExceptionType, ExceptionStatus } from '../../entities/exception-order.entity';

class RepairPartDto {
  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsString()
  partName: string;

  @IsOptional()
  @IsString()
  partModel?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  cost: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;
}

export class CreateExceptionDto {
  @IsNumber()
  orderId: number;

  @IsEnum(ExceptionType)
  type: ExceptionType;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  reportedBy?: string;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairPartDto)
  repairParts?: RepairPartDto[];
}

export class UpdateExceptionDto {
  @IsOptional()
  @IsEnum(ExceptionStatus)
  status?: ExceptionStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  preventiveMeasures?: string;

  @IsOptional()
  @IsString()
  communicationHistory?: string;
}

export class AddRepairPartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairPartDto)
  repairParts: RepairPartDto[];
}
