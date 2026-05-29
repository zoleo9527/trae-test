import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Disease } from './disease.entity';
import { DiseaseService } from './disease.service';
import { CreateDiseaseDto, QueryDiseaseDto, UpdateDiseaseStatusDto } from './dto/disease.dto';

@Controller('api/diseases')
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Get()
  async findAll(@Query() query: QueryDiseaseDto): Promise<Disease[]> {
    return this.diseaseService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Disease> {
    return this.diseaseService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateDiseaseDto): Promise<Disease> {
    return this.diseaseService.create(dto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body() dto: UpdateDiseaseStatusDto,
  ): Promise<Disease> {
    return this.diseaseService.updateStatus(id, dto);
  }
}
