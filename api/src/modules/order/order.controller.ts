import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { OrderStatus } from '../../entities/order.entity';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('keyword') keyword?: string,
    @Query('status') status?: OrderStatus,
    @Query('salesConsultant') salesConsultant?: string,
  ) {
    return this.orderService.findAll(
      { page: +page, pageSize: +pageSize },
      keyword,
      status,
      salesConsultant,
    );
  }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.orderService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Get('order-no/:orderNo')
  findByOrderNo(@Param('orderNo') orderNo: string) {
    return this.orderService.findByOrderNo(orderNo);
  }

  @Get(':id/activity-logs')
  getActivityLogs(@Param('id') id: string) {
    return this.orderService.getActivityLogs(+id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.orderService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.orderService.update(+id, dto, operator);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.orderService.updateStatus(+id, dto, operator);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.orderService.remove(+id, operator);
  }
}
