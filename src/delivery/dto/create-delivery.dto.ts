import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { DeliveryStatus } from '../entities/delivery.entity';

export class CreateDeliveryDto {
  @IsString()
  projectId: string;

  @IsString()
  projectName: string;

  @IsEnum(DeliveryStatus)
  @IsOptional()
  status?: DeliveryStatus;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsString()
  @IsOptional()
  deliveryLocation?: string;

  @IsString()
  materials: string;

  @IsNumber()
  @IsOptional()
  totalQuantity?: number;

  @IsString()
  @IsOptional()
  qualityCheckNotes?: string;

  @IsString()
  @IsOptional()
  damageNotes?: string;

  @IsString()
  @IsOptional()
  trackingInfo?: string;

  @IsUUID()
  @IsOptional()
  changeOrderId?: string;
}
