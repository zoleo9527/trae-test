import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { InspectionStatus } from '../inspection.entity';

export class CreateInspectionDto {
  @IsNumber()
  plotId: number;

  @IsNumber()
  inspectorId: number;

  @IsOptional()
  @IsString()
  growthStatus?: string;

  @IsOptional()
  @IsString()
  soilCondition?: string;

  @IsOptional()
  @IsString()
  moistureCondition?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsDateString()
  inspectionDate: string;

  @IsOptional()
  @IsBoolean()
  hasDisease?: boolean;
}

export class QueryInspectionDto {
  @IsOptional()
  @IsNumber()
  plotId?: number;

  @IsOptional()
  @IsNumber()
  inspectorId?: number;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional()
  @IsBoolean()
  hasDisease?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
