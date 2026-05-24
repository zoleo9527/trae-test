import { IsEnum, IsUUID, IsString } from 'class-validator';
import { MaterialStatus } from '../../../common/enums/material-status.enum';

export class UpdateMaterialStatusDto {
  @IsEnum(MaterialStatus)
  status: MaterialStatus;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
