import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { CheckinService } from './checkin.service';
import {
  CreateCheckinRecordDto,
  CheckinQueryDto,
  ManualCheckinDto,
} from './dto/checkin.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { CheckinRecord } from '../../entities/checkin-record.entity';
import { ExportService, ExportColumn } from '../../common/services/export.service';

@ApiTags('checkins')
@Controller('api/checkins')
export class CheckinController {
  constructor(
    private readonly checkinService: CheckinService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建签到记录' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCheckinRecordDto): Promise<ApiResponse<CheckinRecord>> {
    const data = await this.checkinService.create(createDto);
    return new ApiResponse(data, 'Checkin record created successfully');
  }

  @Post('manual')
  @ApiOperation({ summary: '人工签到（根据身份证号）' })
  async manualCheckin(@Body() manualDto: ManualCheckinDto): Promise<ApiResponse<CheckinRecord>> {
    const data = await this.checkinService.manualCheckin(manualDto);
    return new ApiResponse(data, 'Checkin successful');
  }

  @Get()
  @ApiOperation({ summary: '获取签到记录列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: CheckinQueryDto,
  ): Promise<ApiResponse<PaginatedResponse<CheckinRecord>>> {
    const data = await this.checkinService.findAll(pagination, filters);
    return new ApiResponse(data);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取签到统计' })
  async getStats(
    @Query('projectId') projectId?: string,
    @Query('date') date?: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.checkinService.getCheckinStats(projectId, date);
    return new ApiResponse(data);
  }

  @Get('today')
  @ApiOperation({ summary: '获取今日签到列表' })
  async getTodayCheckins(@Query('projectId') projectId: string): Promise<ApiResponse<any>> {
    const data = await this.checkinService.getTodayCheckinList(projectId);
    return new ApiResponse(data);
  }

  @Get('export')
  @ApiOperation({ summary: '导出签到记录' })
  async export(
    @Query() filters: CheckinQueryDto,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res: Response,
  ): Promise<void> {
    const pagination = new PaginationQueryDto();
    pagination.pageSize = 10000;
    const result = await this.checkinService.findAll(pagination, filters);

    const columns: ExportColumn[] = [
      { header: '项目', key: 'projectName', width: 20 },
      { header: '人员姓名', key: 'personName', width: 15 },
      { header: '证件号', key: 'credentialNo', width: 20 },
      { header: '类型', key: 'type', width: 10 },
      { header: '状态', key: 'status', width: 12 },
      { header: '签到时间', key: 'checkinTime', width: 25 },
      { header: '签到点', key: 'checkinPoint', width: 15 },
    ];

    const exportData = result.items.map((item: any) => ({
      projectName: item.project?.name || '',
      personName: item.person?.name || '',
      credentialNo: item.credential?.credentialNo || '',
      type: item.type,
      status: item.status,
      checkinTime: item.checkinTime?.toISOString().replace('T', ' ').slice(0, 19) || '',
      checkinPoint: item.checkinPoint || '',
    }));

    if (format === 'csv') {
      const csv = this.exportService.exportToCsv(exportData, columns);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=checkins.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = await this.exportService.exportToExcel(exportData, columns, '签到记录');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=checkins.xlsx');
      res.send(buffer);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取签到记录详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<CheckinRecord>> {
    const data = await this.checkinService.findOne(id);
    return new ApiResponse(data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除签到记录' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.checkinService.remove(id);
  }
}
