import { IsString, IsOptional, IsUUID, IsDate, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateDowntimeDto {
  @IsUUID()
  workOrderId: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateDowntimeDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmDowntimeDto {
  @IsUUID()
  confirmedById: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryDowntimeDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isConfirmed?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
