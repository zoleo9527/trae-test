import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewLevel } from '../../../entities/review-record.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateReviewDto {
  @IsUUID()
  workOrderId: string;

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

  @IsOptional()
  @IsUUID()
  submittedById?: string;
}

export class UpdateReviewDto {
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
  verifiedById: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryReviewDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsEnum(ReviewLevel)
  level?: ReviewLevel;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVerified?: boolean;
}
