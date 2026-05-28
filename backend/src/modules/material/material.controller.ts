import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MaterialService } from './material.service';
import { Material, MaterialDistribution } from '../../entities';

@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  findAll(): Promise<Material[]> {
    return this.materialService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.materialService.getStats();
  }

  @Get('distributions')
  getDistributions(@Query('camperId') camperId?: string): Promise<MaterialDistribution[]> {
    return this.materialService.getDistributions(camperId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Material> {
    return this.materialService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Material>): Promise<Material> {
    return this.materialService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Material>): Promise<Material> {
    return this.materialService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.materialService.remove(id);
  }

  @Post('distribute')
  distribute(@Body() data: Partial<MaterialDistribution>): Promise<MaterialDistribution> {
    return this.materialService.distribute(data);
  }

  @Post(':id/restock')
  restock(@Param('id') id: string, @Body() body: { quantity: number }): Promise<Material> {
    return this.materialService.restock(id, body.quantity);
  }
}
