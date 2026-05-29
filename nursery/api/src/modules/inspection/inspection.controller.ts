import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateInspectionDto, QueryInspectionDto } from './dto/inspection.dto';
import { Inspection } from './inspection.entity';
import { InspectionService } from './inspection.service';

@Controller('api/inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Get()
  async findAll(@Query() query: QueryInspectionDto): Promise<Inspection[]> {
    return this.inspectionService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Inspection> {
    return this.inspectionService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateInspectionDto): Promise<Inspection> {
    return this.inspectionService.create(dto);
  }

  @Put(':id/complete')
  async complete(@Param('id') id: number, @Body() dto: Partial<CreateInspectionDto>): Promise<Inspection> {
    return this.inspectionService.complete(id, dto);
  }
}
