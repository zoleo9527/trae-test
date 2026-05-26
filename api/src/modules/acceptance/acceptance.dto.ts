import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { AcceptanceStatus } from '../../entities/acceptance-record.entity';

export class CreateAcceptanceDto {
  @IsNumber()
  orderId: number;

  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @IsOptional()
  @IsString()
  overallEvaluation?: string;

  @IsOptional()
  @IsString()
  qualityIssues?: string;

  @IsOptional()
  @IsString()
  installationIssues?: string;

  @IsOptional()
  @IsString()
  missingItems?: string;

  @IsOptional()
  @IsString()
  rectificationPlan?: string;

  @IsOptional()
  @IsString()
  customerFeedback?: string;

  @IsOptional()
  @IsNumber()
  satisfactionScore?: number;

  @IsOptional()
  @IsString()
  inspectorName?: string;

  @IsOptional()
  @IsBoolean()
  customerSignature?: boolean;

  @IsOptional()
  @IsString()
  rectificationDueDate?: string;
}

export class UpdateAcceptanceDto {
  @IsOptional()
  @IsEnum(AcceptanceStatus)
  status?: AcceptanceStatus;

  @IsOptional()
  @IsString()
  overallEvaluation?: string;

  @IsOptional()
  @IsString()
  qualityIssues?: string;

  @IsOptional()
  @IsString()
  installationIssues?: string;

  @IsOptional()
  @IsString()
  missingItems?: string;

  @IsOptional()
  @IsString()
  rectificationPlan?: string;

  @IsOptional()
  @IsString()
  customerFeedback?: string;

  @IsOptional()
  @IsNumber()
  satisfactionScore?: number;

  @IsOptional()
  @IsString()
  inspectorName?: string;

  @IsOptional()
  @IsBoolean()
  customerSignature?: boolean;

  @IsOptional()
  @IsString()
  rectificationDueDate?: string;
}

export class CompleteRectificationDto {
  @IsString()
  rectificationResult: string;

  @IsOptional()
  @IsNumber()
  satisfactionScore?: number;
}
