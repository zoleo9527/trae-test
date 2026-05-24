import { Controller, Get, Post, Put, Body, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('work-orders')
@Controller('work-orders')
@UseFilters(BusinessExceptionFilter)
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  @ApiOperation({ summary: '创建工单' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createDto: CreateWorkOrderDto) {
    return this.workOrderService.create(
      createDto,
      createDto.operatorId,
      createDto.operatorName,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取工单列表' })
  findAll(@Query() query: QueryWorkOrderDto) {
    return this.workOrderService.findAll(query.page, query.limit, {
      status: query.status,
      studentId: query.studentId,
      currentConsultantId: query.currentConsultantId,
    });
  }

  @Get('overview')
  @ApiOperation({ summary: '获取工单概览统计' })
  getOverview(@Query('consultantId') consultantId?: string) {
    return this.workOrderService.getOverview(consultantId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工单详情' })
  findOne(@Param('id') id: string) {
    return this.workOrderService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新工单状态' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrderService.updateStatus(
      id,
      updateDto.status,
      updateDto.operatorId,
      updateDto.operatorName,
      updateDto.remark,
    );
  }
}
