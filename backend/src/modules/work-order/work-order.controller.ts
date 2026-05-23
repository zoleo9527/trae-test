import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, QueryWorkOrderDto, TransitionStatusDto, AssignHandlerDto } from './dto/work-order.dto';
import { WorkOrder } from '../../entities/work-order.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Controller('api/work-orders')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  async create(@Body() createDto: CreateWorkOrderDto): Promise<WorkOrder> {
    return this.workOrderService.create(createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryWorkOrderDto): Promise<PaginatedResult<WorkOrder>> {
    return this.workOrderService.findAll(queryDto);
  }

  @Get('statistics')
  async getStatistics(): Promise<any> {
    return this.workOrderService.getStatistics();
  }

  @Get('export')
  async export(@Query() queryDto: QueryWorkOrderDto): Promise<{ filePath: string }> {
    const filePath = await this.workOrderService.exportToCsv(queryDto);
    return { filePath };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WorkOrder> {
    return this.workOrderService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateWorkOrderDto): Promise<WorkOrder> {
    return this.workOrderService.update(id, updateDto);
  }

  @Put(':id/assign-handler')
  async assignHandler(@Param('id') id: string, @Body() assignDto: AssignHandlerDto): Promise<WorkOrder> {
    return this.workOrderService.assignHandler(id, assignDto);
  }

  @Post(':id/transition')
  async transitionStatus(@Param('id') id: string, @Body() transitionDto: TransitionStatusDto): Promise<WorkOrder> {
    return this.workOrderService.transitionStatus(id, transitionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.workOrderService.delete(id);
  }
}
