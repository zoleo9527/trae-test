import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsObject } from 'class-validator';
import { SettlementStatus } from '../../../common/enums/settlement.enum';

export class CreateSettlementDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  contractAmount?: number;

  @IsOptional()
  @IsString()
  settlementItems?: string;

  @IsOptional()
  @IsObject()
  attachmentFiles?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateSettlementDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  contractAmount?: number;

  @IsOptional()
  @IsNumber()
  confirmedAmount?: number;

  @IsOptional()
  @IsString()
  settlementItems?: string;

  @IsOptional()
  @IsObject()
  attachmentFiles?: Record<string, any>;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateSettlementStatusDto {
  @IsEnum(SettlementStatus)
  status: SettlementStatus;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsNumber()
  auditAmount?: number;

  @IsOptional()
  @IsDateString()
  expectedPaymentDate?: string;
}

export class SupplierConfirmDto {
  @IsNumber()
  confirmedAmount: number;

  @IsOptional()
  @IsString()
  supplierRemark?: string;
}

export class SettlementQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @IsOptional()
  @IsString()
  keyword?: string;
}
