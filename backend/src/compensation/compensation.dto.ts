import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCompensationDto {
  @IsString()
  type: 'full_refund' | 'partial_refund' | 'rework' | 'discount' | 'other';

  @IsNumber()
  amount: number;

  @IsNumber()
  @IsOptional()
  customerCost?: number;

  @IsNumber()
  @IsOptional()
  labCost?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateCompensationDto {
  @IsString()
  @IsOptional()
  status?: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  customerCost?: number;

  @IsNumber()
  @IsOptional()
  labCost?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  ownerReview?: string;

  @IsString()
  @IsOptional()
  approvedBy?: string;
}
