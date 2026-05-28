import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { MedicalReport } from '../../entities';

@Controller('medical')
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get()
  findAll(@Query('status') status?: string): Promise<MedicalReport[]> {
    return this.medicalService.findAll(status);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.medicalService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<MedicalReport> {
    return this.medicalService.findOne(id);
  }

  @Get('camper/:camperId')
  findByCamper(@Param('camperId') camperId: string): Promise<MedicalReport[]> {
    return this.medicalService.findByCamper(camperId);
  }

  @Post()
  create(@Body() data: Partial<MedicalReport>): Promise<MedicalReport> {
    return this.medicalService.create(data);
  }

  @Post(':id/handle')
  handle(
    @Param('id') id: string,
    @Body() body: { handledBy: string; handlingNote: string; parentNotified?: boolean; parentNotification?: string },
  ): Promise<MedicalReport> {
    return this.medicalService.handle(id, body);
  }
}
