import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsObject } from 'class-validator';
import { MaterialStatus } from '../../../common/enums/material.enum';

export class CreateMaterialDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsObject()
  attachmentFiles?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsObject()
  attachmentFiles?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateMaterialStatusDto {
  @IsEnum(MaterialStatus)
  status: MaterialStatus;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  reviewRemark?: string;

  @IsOptional()
  @IsString()
  receiver?: string;
}

export class MaterialQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateNewVersionDto {
  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
