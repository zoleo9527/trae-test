import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { InstallationService } from './installation.service';
import { CreateInstallationDto, UpdateInstallationDto, RescheduleDto } from './installation.dto';
import { AppointmentStatus } from '../../entities/installation-appointment.entity';

@Controller('api/installations')
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('installerName') installerName?: string,
  ) {
    return this.installationService.findAll(
      { page: +page, pageSize: +pageSize },
      status,
      startDate,
      endDate,
      installerName,
    );
  }

  @Get('calendar/view')
  getCalendarView(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.installationService.getCalendarView(startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.installationService.findOne(+id);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.installationService.findByOrderId(+orderId);
  }

  @Post()
  create(@Body() dto: CreateInstallationDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.installationService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInstallationDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.installationService.update(+id, dto, operator);
  }

  @Put(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.installationService.reschedule(+id, dto, operator);
  }

  @Put(':id/start')
  startInstallation(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.installationService.startInstallation(+id, operator);
  }

  @Put(':id/complete')
  completeInstallation(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.installationService.completeInstallation(+id, operator);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.installationService.remove(+id, operator);
  }
}
