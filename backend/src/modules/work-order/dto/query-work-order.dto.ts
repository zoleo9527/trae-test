import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryWorkOrderDto extends PaginationDto {
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  currentConsultantId?: string;
}
