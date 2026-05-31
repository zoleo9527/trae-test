import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DailyReportService } from './daily-report.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('施工日报')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-reports')
export class DailyReportController {
  constructor(private readonly dailyReportService: DailyReportService) {}

  @Post()
  @ApiOperation({ summary: '创建施工日报' })
  create(@Request() req, @Body() createDailyReportDto: CreateDailyReportDto) {
    return this.dailyReportService.create(createDailyReportDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取施工日报列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dailyReportService.findAll(page, limit, { projectId, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取施工日报详情' })
  findOne(@Param('id') id: string) {
    return this.dailyReportService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新施工日报' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDailyReportDto: UpdateDailyReportDto,
  ) {
    return this.dailyReportService.update(id, updateDailyReportDto, req.user);
  }

  @Get('change-order/:changeOrderId')
  @ApiOperation({ summary: '获取变更单关联的施工日报' })
  findByChangeOrder(@Param('changeOrderId') changeOrderId: string) {
    return this.dailyReportService.findByChangeOrder(changeOrderId);
  }
}
