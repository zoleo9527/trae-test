import { IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';
import { TransferStatus } from '../../../common/enums/transfer-status.enum';

export class UpdateTransferStatusDto {
  @IsEnum(TransferStatus)
  status: TransferStatus;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
