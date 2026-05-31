import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('首页统计')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取首页概览数据' })
  getOverview(@Request() req) {
    return this.dashboardService.getOverview(req.user);
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待处理事项' })
  getPendingItems(@Request() req) {
    return this.dashboardService.getPendingItems(req.user);
  }

  @Get('rejected')
  @ApiOperation({ summary: '获取已驳回事项' })
  getRejectedItems(@Request() req) {
    return this.dashboardService.getRejectedItems(req.user);
  }

  @Get('needs-review')
  @ApiOperation({ summary: '获取需回查事项' })
  getNeedsReview(@Request() req) {
    return this.dashboardService.getNeedsReview(req.user);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取状态统计' })
  getStatusStatistics() {
    return this.dashboardService.getStatusStatistics();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: '获取最近活动' })
  getRecentActivity(@Request() req) {
    return this.dashboardService.getRecentActivity(req.user);
  }

  @Get('my-tasks')
  @ApiOperation({ summary: '获取我的任务' })
  getMyTasks(@Request() req) {
    return this.dashboardService.getMyTasks(req.user);
  }
}
