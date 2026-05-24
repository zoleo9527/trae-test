import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  workOrderId: string;

  @IsUUID()
  fromConsultantId: string;

  @IsUUID()
  toConsultantId: string;

  @IsString()
  handoverContent: string;

  @IsOptional()
  @IsString()
  keyNotes?: string;

  @IsOptional()
  @IsString()
  pendingItems?: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
