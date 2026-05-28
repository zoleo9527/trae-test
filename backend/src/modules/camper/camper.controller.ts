import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CamperService } from './camper.service';
import { Camper } from '../../entities';

@Controller('campers')
export class CamperController {
  constructor(private readonly camperService: CamperService) {}

  @Get()
  findAll(): Promise<Camper[]> {
    return this.camperService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.camperService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Camper> {
    return this.camperService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Camper>): Promise<Camper> {
    return this.camperService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Camper>): Promise<Camper> {
    return this.camperService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.camperService.remove(id);
  }

  @Put(':id/assign-room')
  assignRoom(
    @Param('id') id: string,
    @Body() body: { roomId: string; bedNumber: number },
  ): Promise<Camper> {
    return this.camperService.assignRoom(id, body.roomId, body.bedNumber);
  }

  @Put(':id/unassign-room')
  unassignRoom(@Param('id') id: string): Promise<Camper> {
    return this.camperService.unassignRoom(id);
  }
}
