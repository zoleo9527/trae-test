import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CheckIn } from '../../entities';

@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Get()
  findAll(@Query('activityDate') activityDate?: string): Promise<CheckIn[]> {
    return this.checkInService.findAll(activityDate);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.checkInService.getStats();
  }

  @Get('camper/:camperId')
  findByCamper(@Param('camperId') camperId: string): Promise<CheckIn[]> {
    return this.checkInService.findByCamper(camperId);
  }

  @Post()
  create(@Body() data: Partial<CheckIn>): Promise<CheckIn> {
    return this.checkInService.create(data);
  }

  @Post('batch')
  batchCreate(@Body() body: { activity: string; activityDate: Date; camperIds: string[] }): Promise<CheckIn[]> {
    return this.checkInService.batchCreate(body.activity, body.activityDate, body.camperIds);
  }

  @Post(':id/check')
  checkIn(@Param('id') id: string, @Body() body: { checkedInBy: string; remark?: string }): Promise<CheckIn> {
    return this.checkInService.checkIn(id, body);
  }
}
