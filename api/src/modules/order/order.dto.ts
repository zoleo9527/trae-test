import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../entities/order.entity';

class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productModel?: string;

  @IsOptional()
  @IsString()
  customSpec?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  subtotal: number;
}

export class CreateOrderDto {
  @IsNumber()
  customerId: number;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsOptional()
  @IsString()
  customConfig?: string;

  @IsOptional()
  @IsString()
  salesConsultant?: string;

  @IsOptional()
  @IsString()
  showroomManager?: string;

  @IsOptional()
  @IsString()
  installationCoordinator?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsOptional()
  @IsString()
  customConfig?: string;

  @IsOptional()
  @IsString()
  salesConsultant?: string;

  @IsOptional()
  @IsString()
  showroomManager?: string;

  @IsOptional()
  @IsString()
  installationCoordinator?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  actualDeliveryDate?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}
