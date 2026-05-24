import { IsString, IsUUID } from 'class-validator';

export class UploadVersionDto {
  @IsString()
  fileUrl: string;

  @IsString()
  changeLog: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
