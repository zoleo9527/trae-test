import { IsString, IsUUID, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { MaterialType } from '../../../common/enums/material-status.enum';

export class CreateMaterialDto {
  @IsUUID()
  workOrderId: string;

  @IsString()
  name: string;

  @IsEnum(MaterialType)
  type: MaterialType;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsUUID()
  ownerId: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
