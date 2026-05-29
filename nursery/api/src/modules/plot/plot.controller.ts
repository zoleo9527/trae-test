import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreatePlotDto, QueryPlotDto } from './dto/plot.dto';
import { Plot } from './plot.entity';
import { PlotService } from './plot.service';

@Controller('api/plots')
export class PlotController {
  constructor(private readonly plotService: PlotService) {}

  @Get()
  async findAll(@Query() query: QueryPlotDto): Promise<Plot[]> {
    return this.plotService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Plot> {
    return this.plotService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePlotDto): Promise<Plot> {
    return this.plotService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: Partial<CreatePlotDto>): Promise<Plot> {
    return this.plotService.update(id, dto);
  }
}
