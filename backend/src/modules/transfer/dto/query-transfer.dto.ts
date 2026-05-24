import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TransferStatus } from '../../../common/enums/transfer-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryTransferDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsUUID()
  fromConsultantId?: string;

  @IsOptional()
  @IsUUID()
  toConsultantId?: string;
}
