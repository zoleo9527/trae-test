import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { MaterialStatus, MaterialType } from '../../../common/enums/material-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryMaterialDto extends PaginationDto {
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;
}
