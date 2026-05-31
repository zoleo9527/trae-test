import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ChangeOrderType } from '../../common/enums/change-order-status.enum';

export class CreateChangeOrderDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ChangeOrderType)
  changeType: ChangeOrderType;

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

  @IsString()
  @IsOptional()
  reworkReason?: string;

  @IsString()
  @IsOptional()
  materialTracking?: string;

  @IsNumber()
  @IsOptional()
  originalAmount?: number;

  @IsNumber()
  @IsOptional()
  changedAmount?: number;

  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  materialCost?: number;

  @IsNumber()
  @IsOptional()
  equipmentCost?: number;

  @IsNumber()
  @IsOptional()
  otherCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedDays?: number;

  @IsDateString()
  @IsOptional()
  proposedDate?: string;
}
