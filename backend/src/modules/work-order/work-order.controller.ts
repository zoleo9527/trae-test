import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkOrderService, CreateWorkOrderDto, UpdateWorkOrderDto, ChangeStatusDto, HandoverItemDto } from './work-order.service';
import { CurrentUser, Roles } from '../../common/auth';
import { User, UserRole, WorkOrder, WorkOrderStatus } from '../../database/entities';

@Controller('work-orders')
@UseGuards(AuthGuard('jwt'))
export class WorkOrderController {
  constructor(private workOrderService: WorkOrderService) {}

  @Post()
  create(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrderService.create(dto, user);
  }

  @Get()
  findAll(
    @Query('status') status?: WorkOrderStatus,
    @Query('type') type?: string,
    @Query('memberId') memberId?: string,
    @Query('handlerId') handlerId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.workOrderService.findAll(
      { status, type, memberId, handlerId },
      Number(page),
      Number(limit),
    );
  }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.workOrderService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<WorkOrder> {
    return this.workOrderService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrderService.update(id, dto, user);
  }

  @Put(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: User,
  ): Promise<WorkOrder> {
    return this.workOrderService.changeStatus(id, dto, user);
  }

  @Get(':id/histories')
  getStatusHistories(@Param('id') id: string) {
    return this.workOrderService.getStatusHistories(id);
  }

  @Get(':id/audit-logs')
  getAuditLogs(@Param('id') id: string) {
    return this.workOrderService.getAuditLogs(id);
  }

  @Put(':id/items/:itemId/receive')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  receiveItem(
    @Param('id') workOrderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: HandoverItemDto,
    @CurrentUser() user: User,
  ) {
    return this.workOrderService.receiveItem(workOrderId, itemId, dto, user);
  }

  @Put(':id/items/:itemId/return')
  @Roles(UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN)
  returnItem(
    @Param('id') workOrderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: HandoverItemDto,
    @CurrentUser() user: User,
  ) {
    return this.workOrderService.returnItem(workOrderId, itemId, dto, user);
  }
}
