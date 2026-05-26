import { IsString, IsOptional, IsNumber, IsEnum, IsDate } from 'class-validator';
import { AppointmentStatus } from '../../entities/installation-appointment.entity';

export class CreateInstallationDto {
  @IsNumber()
  orderId: number;

  @IsString()
  appointmentDate: string;

  @IsString()
  timeSlot: string;

  @IsOptional()
  @IsString()
  installerName?: string;

  @IsOptional()
  @IsString()
  installerPhone?: string;

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsString()
  customerRemark?: string;

  @IsOptional()
  @IsString()
  internalRemark?: string;

  @IsOptional()
  @IsString()
  preCheckItems?: string;
}

export class UpdateInstallationDto {
  @IsOptional()
  @IsString()
  appointmentDate?: string;

  @IsOptional()
  @IsString()
  timeSlot?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  installerName?: string;

  @IsOptional()
  @IsString()
  installerPhone?: string;

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsString()
  customerRemark?: string;

  @IsOptional()
  @IsString()
  internalRemark?: string;

  @IsOptional()
  @IsString()
  preCheckItems?: string;

  @IsOptional()
  @IsNumber()
  previousAppointmentId?: number;
}

export class RescheduleDto {
  @IsString()
  appointmentDate: string;

  @IsString()
  timeSlot: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
