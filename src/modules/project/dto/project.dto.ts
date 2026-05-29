import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsObject } from 'class-validator';
import { ProjectStatus, ProjectPhase } from '../../../common/enums/project.enum';

export class CreateProjectDto {
  @IsString()
  projectNo: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  constructionStartDate?: string;

  @IsOptional()
  @IsDateString()
  constructionEndDate?: string;

  @IsOptional()
  @IsDateString()
  exhibitionStartDate?: string;

  @IsOptional()
  @IsDateString()
  exhibitionEndDate?: string;

  @IsOptional()
  @IsDateString()
  teardownStartDate?: string;

  @IsOptional()
  @IsDateString()
  teardownEndDate?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  boothNo?: string;

  @IsOptional()
  @IsString()
  coordinator?: string;

  @IsOptional()
  @IsString()
  coordinatorPhone?: string;

  @IsOptional()
  @IsString()
  siteSupervisor?: string;

  @IsOptional()
  @IsString()
  siteSupervisorPhone?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  constructionStartDate?: string;

  @IsOptional()
  @IsDateString()
  constructionEndDate?: string;

  @IsOptional()
  @IsDateString()
  teardownStartDate?: string;

  @IsOptional()
  @IsDateString()
  teardownEndDate?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  boothNo?: string;

  @IsOptional()
  @IsString()
  coordinator?: string;

  @IsOptional()
  @IsString()
  coordinatorPhone?: string;

  @IsOptional()
  @IsString()
  siteSupervisor?: string;

  @IsOptional()
  @IsString()
  siteSupervisorPhone?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateProjectPhaseDto {
  @IsEnum(ProjectPhase)
  phase: ProjectPhase;

  @IsOptional()
  @IsString()
  operator?: string;
}

export class ProjectQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPhase)
  currentPhase?: ProjectPhase;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
