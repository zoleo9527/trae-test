import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class CreateWorkOrderDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  problemType?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  filmRollId?: string;

  @IsNumber()
  @IsOptional()
  requestedAmount?: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsBoolean()
  @IsOptional()
  hasEvidence?: boolean;
}

export class UpdateWorkOrderDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  negotiationSummary?: string;

  @IsString()
  @IsOptional()
  reviewConclusion?: string;
}

export class BatchUpdateDto {
  @IsArray()
  @IsNotEmpty()
  ids: string[];

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class AddNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
