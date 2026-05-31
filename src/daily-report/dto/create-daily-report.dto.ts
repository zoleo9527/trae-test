import { IsString, IsOptional, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class CreateDailyReportDto {
  @IsDateString()
  reportDate: string;

  @IsString()
  projectId: string;

  @IsString()
  projectName: string;

  @IsString()
  @IsOptional()
  constructionSite?: string;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsNumber()
  @IsOptional()
  workerCount?: number;

  @IsNumber()
  @IsOptional()
  workHours?: number;

  @IsString()
  workContent: string;

  @IsString()
  @IsOptional()
  progressStatus?: string;

  @IsString()
  @IsOptional()
  qualityIssues?: string;

  @IsString()
  @IsOptional()
  safetyIssues?: string;

  @IsString()
  @IsOptional()
  materialsUsed?: string;

  @IsString()
  @IsOptional()
  equipmentUsed?: string;

  @IsString()
  @IsOptional()
  nextDayPlan?: string;

  @IsString()
  @IsOptional()
  problemsEncountered?: string;

  @IsString()
  @IsOptional()
  weatherCondition?: string;

  @IsUUID()
  @IsOptional()
  changeOrderId?: string;
}
