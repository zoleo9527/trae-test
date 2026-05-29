import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NegotiationStatus } from '../negotiation.entity';

export class CreateNegotiationDto {
  @IsNumber()
  diseaseId: number;

  @IsNumber()
  initiatorId: number;

  @IsOptional()
  @IsString()
  salesOpinion?: string;

  @IsOptional()
  @IsString()
  baseOpinion?: string;

  @IsOptional()
  @IsNumber()
  replantQuantity?: number;

  @IsOptional()
  @IsString()
  replantVariety?: string;

  @IsOptional()
  @IsDateString()
  replantDate?: string;

  @IsOptional()
  @IsEnum(NegotiationStatus)
  status?: NegotiationStatus;
}

export class UpdateNegotiationStatusDto {
  @IsEnum(NegotiationStatus)
  status: NegotiationStatus;

  @IsNumber()
  operatorId: number;

  @IsOptional()
  @IsString()
  salesOpinion?: string;

  @IsOptional()
  @IsString()
  baseOpinion?: string;

  @IsOptional()
  @IsNumber()
  replantQuantity?: number;

  @IsOptional()
  @IsString()
  replantVariety?: string;

  @IsOptional()
  @IsDateString()
  replantDate?: string;
}

export class QueryNegotiationDto {
  @IsOptional()
  @IsNumber()
  diseaseId?: number;

  @IsOptional()
  @IsEnum(NegotiationStatus)
  status?: NegotiationStatus;

  @IsOptional()
  @IsNumber()
  initiatorId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
