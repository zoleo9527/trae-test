import { IsString, IsUUID } from 'class-validator';

export class AddNegotiationDto {
  @IsString()
  history: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;
}
