import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ExceptionService } from './exception.service';
import { CreateExceptionDto, UpdateExceptionDto } from './exception.dto';
import { ExceptionType, ExceptionStatus } from '../../entities/exception-order.entity';
import { RepairPartStatus } from '../../entities/repair-part.entity';

@Controller('api/exceptions')
export class ExceptionController {
  constructor(private readonly exceptionService: ExceptionService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: ExceptionStatus,
    @Query('type') type?: ExceptionType,
    @Query('assignee') assignee?: string,
  ) {
    return this.exceptionService.findAll(
      { page: +page, pageSize: +pageSize },
      status,
      type,
      assignee,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exceptionService.findOne(+id);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.exceptionService.findByOrderId(+orderId);
  }

  @Post()
  create(@Body() dto: CreateExceptionDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.exceptionService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExceptionDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.exceptionService.update(+id, dto, operator);
  }

  @Put('repair-parts/:repairPartId/status')
  updateRepairPartStatus(
    @Param('repairPartId') repairPartId: string,
    @Body('status') status: RepairPartStatus,
    @Request() req,
  ) {
    const operator = req.headers['x-operator'] || 'system';
    return this.exceptionService.updateRepairPartStatus(+repairPartId, status, operator);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.exceptionService.remove(+id, operator);
  }
}
