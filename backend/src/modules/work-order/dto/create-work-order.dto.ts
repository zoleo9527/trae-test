import { IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateWorkOrderDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  studentId: string;

  @IsUUID()
  currentConsultantId: string;

  @IsOptional()
  @IsDateString()
  expectedDeadline?: string;

  @IsOptional()
  @IsString()
  serviceContent?: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
