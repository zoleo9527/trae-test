import { IsString, IsOptional, IsUUID, IsDate, IsNumber, IsEnum, IsBoolean, ArrayNotEmpty, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PartRequestStatus } from '../../../entities/part-usage.entity';
import { ReviewLevel } from '../../../entities/review-record.entity';

export class ConfirmDowntimeDto {
  @IsUUID()
  operatorId: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class RequestPartDto {
  @IsUUID()
  operatorId: string;

  @IsUUID()
  sparePartId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  requestReason?: string;
}

export class ApprovePartDto {
  @IsUUID()
  operatorId: string;

  @IsUUID()
  partUsageId: string;

  @IsEnum(PartRequestStatus)
  status: PartRequestStatus.APPROVED | PartRequestStatus.REJECTED;

  @IsOptional()
  @IsString()
  approvalRemark?: string;
}

export class ReceivePartDto {
  @IsUUID()
  operatorId: string;

  @IsUUID()
  partUsageId: string;
}

export class CompleteRepairDto {
  @IsUUID()
  operatorId: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class SubmitReviewDto {
  @IsUUID()
  operatorId: string;

  @IsOptional()
  @IsEnum(ReviewLevel)
  level?: ReviewLevel;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  repairProcess?: string;

  @IsOptional()
  @IsString()
  improvementMeasures?: string;

  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualDowntimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualPowerLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualPartCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualLaborCost?: number;
}

export class VerifyReviewDto {
  @IsUUID()
  operatorId: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
