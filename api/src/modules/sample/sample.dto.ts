import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { SampleLoanStatus } from '../../entities/sample-loan.entity';

export class CreateSampleLoanDto {
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsNumber()
  productId: number;

  @IsString()
  productName: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsString()
  borrowDate: string;

  @IsOptional()
  @IsString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  conditionOnBorrow?: string;

  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @IsOptional()
  @IsString()
  handledBy?: string;
}

export class UpdateSampleLoanDto {
  @IsOptional()
  @IsEnum(SampleLoanStatus)
  status?: SampleLoanStatus;

  @IsOptional()
  @IsString()
  actualReturnDate?: string;

  @IsOptional()
  @IsString()
  conditionOnReturn?: string;

  @IsOptional()
  @IsString()
  followUpNotes?: string;

  @IsOptional()
  @IsBoolean()
  depositReturned?: boolean;
}

export class SendReminderDto {
  @IsOptional()
  @IsString()
  message?: string;
}
