import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { SampleService } from './sample.service';
import { CreateSampleLoanDto, UpdateSampleLoanDto, SendReminderDto } from './sample.dto';
import { SampleLoanStatus } from '../../entities/sample-loan.entity';

@Controller('api/samples')
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: SampleLoanStatus,
    @Query('customerName') customerName?: string,
  ) {
    return this.sampleService.findAll(
      { page: +page, pageSize: +pageSize },
      status,
      customerName,
    );
  }

  @Get('overdue/list')
  getOverdueSamples() {
    return this.sampleService.getOverdueSamples();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sampleService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateSampleLoanDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.sampleService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSampleLoanDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.sampleService.update(+id, dto, operator);
  }

  @Put(':id/remind')
  sendReminder(@Param('id') id: string, @Body() dto: SendReminderDto) {
    return this.sampleService.sendReminder(+id, dto.message);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.sampleService.remove(+id, operator);
  }
}
