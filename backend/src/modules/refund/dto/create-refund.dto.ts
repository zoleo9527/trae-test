import { IsString, IsUUID, IsNumber, IsOptional } from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  workOrderId: string;

  @IsNumber()
  requestedAmount: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  negotiationHistory?: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
