import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, QueryWorkOrderDto, TransitionStatusDto, AssignHandlerDto } from './dto/work-order.dto';
import {
  ConfirmDowntimeDto,
  RequestPartDto,
  ApprovePartDto,
  ReceivePartDto,
  CompleteRepairDto,
  SubmitReviewDto,
  VerifyReviewDto,
} from './dto/workflow.dto';
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

  @Post(':id/confirm-downtime')
  async confirmDowntime(@Param('id') id: string, @Body() dto: ConfirmDowntimeDto): Promise<WorkOrder> {
    return this.workOrderService.confirmDowntime(id, dto);
  }

  @Post(':id/request-part')
  async requestPart(@Param('id') id: string, @Body() dto: RequestPartDto): Promise<WorkOrder> {
    return this.workOrderService.requestPart(id, dto);
  }

  @Post(':id/approve-part')
  async approvePart(@Param('id') id: string, @Body() dto: ApprovePartDto): Promise<WorkOrder> {
    return this.workOrderService.approvePart(id, dto);
  }

  @Post(':id/receive-part')
  async receivePart(@Param('id') id: string, @Body() dto: ReceivePartDto): Promise<WorkOrder> {
    return this.workOrderService.receivePart(id, dto);
  }

  @Post(':id/complete-repair')
  async completeRepair(@Param('id') id: string, @Body() dto: CompleteRepairDto): Promise<WorkOrder> {
    return this.workOrderService.completeRepair(id, dto);
  }

  @Post(':id/submit-review')
  async submitReview(@Param('id') id: string, @Body() dto: SubmitReviewDto): Promise<WorkOrder> {
    return this.workOrderService.submitReview(id, dto);
  }

  @Post(':id/verify-review')
  async verifyReview(@Param('id') id: string, @Body() dto: VerifyReviewDto): Promise<WorkOrder> {
    return this.workOrderService.verifyReview(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.workOrderService.delete(id);
  }
}
