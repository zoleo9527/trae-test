import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChangeOrderService } from './change-order.service';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { StatusTransitionDto } from './dto/status-transition.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ChangeOrderStatus } from '../common/enums/change-order-status.enum';

@ApiTags('变更单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('change-orders')
export class ChangeOrderController {
  constructor(private readonly changeOrderService: ChangeOrderService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.SUPERVISOR)
  @ApiOperation({ summary: '创建变更单' })
  create(@Request() req, @Body() createChangeOrderDto: CreateChangeOrderDto) {
    return this.changeOrderService.create(createChangeOrderDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取变更单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ChangeOrderStatus })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: ChangeOrderStatus,
    @Query('projectId') projectId?: string,
  ) {
    return this.changeOrderService.findAll(page, limit, { status, projectId });
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待处理的变更单' })
  getPending(@Request() req) {
    return this.changeOrderService.getPendingForUser(req.user);
  }

  @Get('rejected')
  @ApiOperation({ summary: '获取已驳回的变更单' })
  getRejected(@Request() req) {
    return this.changeOrderService.getRejectedForUser(req.user);
  }

  @Get('needs-review')
  @ApiOperation({ summary: '获取需回查的变更单' })
  getNeedsReview(@Request() req) {
    return this.changeOrderService.getNeedsReview(req.user);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取变更单统计数据' })
  getStatistics() {
    return this.changeOrderService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取变更单详情' })
  findOne(@Param('id') id: string) {
    return this.changeOrderService.findOne(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '获取变更单版本历史' })
  getVersions(@Param('id') id: string) {
    return this.changeOrderService.getVersions(id);
  }

  @Get(':id/versions/:versionNumber')
  @ApiOperation({ summary: '获取指定版本详情' })
  getVersion(@Param('id') id: string, @Param('versionNumber') versionNumber: number) {
    return this.changeOrderService.getVersion(id, versionNumber);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.SUPERVISOR)
  @ApiOperation({ summary: '更新变更单' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateChangeOrderDto: UpdateChangeOrderDto,
  ) {
    return this.changeOrderService.update(id, updateChangeOrderDto, req.user);
  }

  @Post(':id/transition')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.SUPERVISOR)
  @ApiOperation({ summary: '变更单状态流转' })
  transitionStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() transitionDto: StatusTransitionDto,
  ) {
    return this.changeOrderService.transitionStatus(id, transitionDto, req.user);
  }
}
