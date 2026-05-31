import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DeliveryStatus } from './entities/delivery.entity';

@ApiTags('发货回单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @ApiOperation({ summary: '创建发货回单' })
  create(@Request() req, @Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveryService.create(createDeliveryDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取发货回单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('projectId') projectId?: string,
    @Query('status') status?: DeliveryStatus,
  ) {
    return this.deliveryService.findAll(page, limit, { projectId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取发货回单详情' })
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新发货回单' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
  ) {
    return this.deliveryService.update(id, updateDeliveryDto, req.user);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: '确认收货' })
  receive(@Request() req, @Param('id') id: string) {
    return this.deliveryService.receive(id, req.user);
  }

  @Get('change-order/:changeOrderId')
  @ApiOperation({ summary: '获取变更单关联的发货回单' })
  findByChangeOrder(@Param('changeOrderId') changeOrderId: string) {
    return this.deliveryService.findByChangeOrder(changeOrderId);
  }
}
