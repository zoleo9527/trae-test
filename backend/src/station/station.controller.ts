import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StationService } from './station.service';

@Controller('api/stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  getStationOverview() {
    return this.stationService.getStationOverview();
  }

  @Get('dashboard')
  getDashboardStats() {
    return this.stationService.getDashboardStats();
  }

  @Get(':id/anomalies')
  checkStationAnomalies(@Param('id') id: string) {
    return this.stationService.checkStationAnomalies(id);
  }

  @Post(':id/escalate')
  escalateIssue(@Param('id') id: string, @Body('reason') reason: string) {
    return this.stationService.escalateStationIssue(id, reason);
  }
}
