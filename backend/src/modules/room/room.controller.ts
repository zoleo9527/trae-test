import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RoomService } from './room.service';
import { Room } from '../../entities';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  findAll(): Promise<Room[]> {
    return this.roomService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.roomService.getStats();
  }

  @Get('assignments')
  getRoomAssignments(): Promise<any[]> {
    return this.roomService.getRoomAssignments();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Room> {
    return this.roomService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Room>): Promise<Room> {
    return this.roomService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Room>): Promise<Room> {
    return this.roomService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.roomService.remove(id);
  }

  @Post(':id/assign-bed')
  assignBed(
    @Param('id') roomId: string,
    @Body() body: { bedNumber: number; camperId: string },
  ): Promise<Room> {
    return this.roomService.assignBed(roomId, body.bedNumber, body.camperId);
  }

  @Post('unassign-bed')
  unassignBed(@Body() body: { camperId: string }): Promise<void> {
    return this.roomService.unassignBed(body.camperId);
  }
}
