import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { AcceptanceService } from './acceptance.service';
import { CreateAcceptanceDto, UpdateAcceptanceDto, CompleteRectificationDto } from './acceptance.dto';
import { AcceptanceStatus } from '../../entities/acceptance-record.entity';

@Controller('api/acceptances')
export class AcceptanceController {
  constructor(private readonly acceptanceService: AcceptanceService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: AcceptanceStatus,
  ) {
    return this.acceptanceService.findAll(
      { page: +page, pageSize: +pageSize },
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.acceptanceService.findOne(+id);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.acceptanceService.findByOrderId(+orderId);
  }

  @Post()
  create(@Body() dto: CreateAcceptanceDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.acceptanceService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAcceptanceDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.acceptanceService.update(+id, dto, operator);
  }

  @Put(':id/submit')
  submitAcceptance(@Param('id') id: string, @Body() dto: CreateAcceptanceDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.acceptanceService.submitAcceptance(+id, dto, operator);
  }

  @Put(':id/rectify')
  completeRectification(@Param('id') id: string, @Body() dto: CompleteRectificationDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.acceptanceService.completeRectification(+id, dto, operator);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.acceptanceService.remove(+id, operator);
  }
}
