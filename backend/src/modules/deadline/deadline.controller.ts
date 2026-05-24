import { Controller, Get, Post, Put, Body, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeadlineService } from './deadline.service';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('deadlines')
@Controller('deadlines')
@UseFilters(BusinessExceptionFilter)
export class DeadlineController {
  constructor(private readonly deadlineService: DeadlineService) {}

  @Post()
  @ApiOperation({ summary: '创建截止日提醒' })
  create(@Body() data: any) {
    return this.deadlineService.create(
      data,
      data.operatorId,
      data.operatorName || 'System',
    );
  }

  @Get('work-order/:workOrderId')
  @ApiOperation({ summary: '获取工单的截止日列表' })
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.deadlineService.findByWorkOrder(workOrderId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '获取即将到期的截止日' })
  findUpcoming(@Query('days') days: number = 7) {
    return this.deadlineService.findUpcoming(days);
  }

  @Get('overdue/check')
  @ApiOperation({ summary: '检查逾期截止日' })
  checkOverdue() {
    return this.deadlineService.checkOverdue();
  }

  @Put(':id/complete')
  @ApiOperation({ summary: '标记截止日任务完成' })
  markComplete(@Param('id') id: string, @Body() data: any) {
    return this.deadlineService.markComplete(
      id,
      data.operatorId,
      data.operatorName || 'System',
    );
  }
}
