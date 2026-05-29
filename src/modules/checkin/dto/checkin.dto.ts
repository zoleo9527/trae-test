import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber, IsObject } from 'class-validator';
import { CheckinType, CheckinStatus } from '../../../common/enums/checkin.enum';

export class CreateCheckinRecordDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  personId: string;

  @IsOptional()
  @IsUUID()
  credentialId?: string;

  @IsEnum(CheckinType)
  type: CheckinType;

  @IsDateString()
  checkinTime: string;

  @IsOptional()
  @IsString()
  checkinPoint?: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CheckinQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsUUID()
  credentialId?: string;

  @IsOptional()
  @IsEnum(CheckinType)
  type?: CheckinType;

  @IsOptional()
  @IsEnum(CheckinStatus)
  status?: CheckinStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class ManualCheckinDto {
  @IsUUID()
  projectId: string;

  @IsString()
  idCardNo: string;

  @IsEnum(CheckinType)
  type: CheckinType;

  @IsOptional()
  @IsString()
  checkinPoint?: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
