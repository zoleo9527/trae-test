import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { SignOffType } from '../../common/enums/sign-off.enum';

export class CreateSignOffDto {
  @IsEnum(SignOffType)
  signOffType: SignOffType;

  @IsUUID()
  @IsOptional()
  changeOrderId?: string;

  @IsUUID()
  @IsOptional()
  dailyReportId?: string;

  @IsUUID()
  @IsOptional()
  deliveryId?: string;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  signerRole?: string;

  @IsString()
  @IsOptional()
  signerDepartment?: string;
}
