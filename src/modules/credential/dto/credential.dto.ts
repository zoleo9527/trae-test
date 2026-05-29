import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsObject } from 'class-validator';
import { CredentialType, CredentialStatus } from '../../../common/enums/credential.enum';

export class CreateCredentialDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  personId: string;

  @IsEnum(CredentialType)
  type: CredentialType;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsString()
  workArea?: string;

  @IsOptional()
  @IsString()
  accessLevel?: string;

  @IsOptional()
  @IsObject()
  applicationFiles?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateCredentialDto {
  @IsOptional()
  @IsEnum(CredentialType)
  type?: CredentialType;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsString()
  workArea?: string;

  @IsOptional()
  @IsString()
  accessLevel?: string;

  @IsOptional()
  @IsObject()
  applicationFiles?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateCredentialStatusDto {
  @IsEnum(CredentialStatus)
  status: CredentialStatus;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  reviewRemark?: string;
}

export class CredentialQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsEnum(CredentialType)
  type?: CredentialType;

  @IsOptional()
  @IsEnum(CredentialStatus)
  status?: CredentialStatus;

  @IsOptional()
  @IsString()
  keyword?: string;
}
