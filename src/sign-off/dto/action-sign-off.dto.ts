import { IsString, IsOptional } from 'class-validator';

export class ActionSignOffDto {
  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  rejectReason?: string;

  @IsString()
  @IsOptional()
  signature?: string;
}
