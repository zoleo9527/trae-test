import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiseaseSeverity, DiseaseStatus } from '../disease.entity';

export class CreateDiseaseDto {
  @IsOptional()
  @IsNumber()
  inspectionId?: number;

  @IsNumber()
  plotId: number;

  @IsNumber()
  reporterId: number;

  @IsString()
  type: string;

  @IsEnum(DiseaseSeverity)
  severity: DiseaseSeverity;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  affectedQuantity?: number;

  @IsDateString()
  reportedAt: string;

  @IsOptional()
  @IsEnum(DiseaseStatus)
  status?: DiseaseStatus;
}

export class UpdateDiseaseStatusDto {
  @IsEnum(DiseaseStatus)
  status: DiseaseStatus;

  @IsNumber()
  operatorId: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryDiseaseDto {
  @IsOptional()
  @IsNumber()
  plotId?: number;

  @IsOptional()
  @IsEnum(DiseaseStatus)
  status?: DiseaseStatus;

  @IsOptional()
  @IsEnum(DiseaseSeverity)
  severity?: DiseaseSeverity;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  reporterId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  isOverdue?: boolean;
}

export class CreateTimelineDto {
  @IsNumber()
  diseaseId: number;

  @IsNumber()
  operatorId: number;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsDateString()
  operatedAt: string;
}
