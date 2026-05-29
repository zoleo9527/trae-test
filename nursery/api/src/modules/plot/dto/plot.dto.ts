import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreatePlotDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  location?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  variety?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  specification?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsNumber()
  inspectorId: number;
}

export class QueryPlotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsOptional()
  @IsNumber()
  inspectorId?: number;
}
