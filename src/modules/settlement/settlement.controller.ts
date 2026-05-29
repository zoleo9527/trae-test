import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { SettlementService } from './settlement.service';
import {
  CreateSettlementDto,
  UpdateSettlementDto,
  UpdateSettlementStatusDto,
  SupplierConfirmDto,
  SettlementQueryDto,
} from './dto/settlement.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { Settlement } from '../../entities/settlement.entity';
import { ExportService, ExportColumn } from '../../common/services/export.service';

@ApiTags('settlements')
@Controller('api/settlements')
export class SettlementController {
  constructor(
    private readonly settlementService: SettlementService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建对账单' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSettlementDto): Promise<ApiResponse<Settlement>> {
    const data = await this.settlementService.create(createDto);
    return new ApiResponse(data, 'Settlement created successfully');
  }

  @Get()
  @ApiOperation({ summary: '获取对账单列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: SettlementQueryDto,
  ): Promise<ApiResponse<PaginatedResponse<Settlement>>> {
    const data = await this.settlementService.findAll(pagination, filters);
    return new ApiResponse(data);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取对账统计' })
  async getStats(@Query('projectId') projectId?: string): Promise<ApiResponse<any>> {
    const data = await this.settlementService.getSettlementStats(projectId);
    return new ApiResponse(data);
  }

  @Get('export')
  @ApiOperation({ summary: '导出对账单' })
  async export(
    @Query() filters: SettlementQueryDto,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res: Response,
  ): Promise<void> {
    const pagination = new PaginationQueryDto();
    pagination.pageSize = 10000;
    const result = await this.settlementService.findAll(pagination, filters);

    const columns: ExportColumn[] = [
      { header: '对账单号', key: 'settlementNo', width: 20 },
      { header: '项目', key: 'projectName', width: 20 },
      { header: '供应商', key: 'supplierName', width: 15 },
      { header: '合同金额', key: 'contractAmount', width: 12 },
      { header: '确认金额', key: 'confirmedAmount', width: 12 },
      { header: '审核金额', key: 'auditAmount', width: 12 },
      { header: '实付金额', key: 'actualPaidAmount', width: 12 },
      { header: '状态', key: 'status', width: 15 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    const exportData = result.items.map((item: any) => ({
      settlementNo: item.settlementNo,
      projectName: item.project?.name || '',
      supplierName: item.supplier?.name || '',
      contractAmount: item.contractAmount || 0,
      confirmedAmount: item.confirmedAmount || 0,
      auditAmount: item.auditAmount || 0,
      actualPaidAmount: item.actualPaidAmount || 0,
      status: item.status,
      createdAt: item.createdAt?.toISOString().split('T')[0] || '',
    }));

    if (format === 'csv') {
      const csv = this.exportService.exportToCsv(exportData, columns);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=settlements.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = await this.exportService.exportToExcel(exportData, columns, '对账单');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=settlements.xlsx');
      res.send(buffer);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取对账单详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Settlement>> {
    const data = await this.settlementService.findOne(id);
    return new ApiResponse(data);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取对账状态历史' })
  async getStatusHistory(@Param('id') id: string): Promise<ApiResponse<any[]>> {
    const data = await this.settlementService.getStatusHistory(id);
    return new ApiResponse(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新对账单' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSettlementDto,
  ): Promise<ApiResponse<Settlement>> {
    const data = await this.settlementService.update(id, updateDto);
    return new ApiResponse(data, 'Settlement updated successfully');
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新对账状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateSettlementStatusDto,
  ): Promise<ApiResponse<Settlement>> {
    const data = await this.settlementService.updateStatus(id, statusDto);
    return new ApiResponse(data, 'Settlement status updated successfully');
  }

  @Post(':id/supplier-confirm')
  @ApiOperation({ summary: '供应商确认对账' })
  async supplierConfirm(
    @Param('id') id: string,
    @Body() confirmDto: SupplierConfirmDto,
  ): Promise<ApiResponse<Settlement>> {
    const data = await this.settlementService.supplierConfirm(id, confirmDto);
    return new ApiResponse(data, 'Settlement confirmed by supplier');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除对账单' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.settlementService.remove(id);
  }
}
