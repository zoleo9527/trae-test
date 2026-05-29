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
import { MaterialService } from './material.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  UpdateMaterialStatusDto,
  MaterialQueryDto,
  CreateNewVersionDto,
} from './dto/material.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { Material } from '../../entities/material.entity';
import { ExportService, ExportColumn } from '../../common/services/export.service';

@ApiTags('materials')
@Controller('api/materials')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建物料' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateMaterialDto): Promise<ApiResponse<Material>> {
    const data = await this.materialService.create(createDto);
    return new ApiResponse(data, 'Material created successfully');
  }

  @Post(':id/version')
  @ApiOperation({ summary: '创建物料新版本' })
  async createNewVersion(
    @Param('id') id: string,
    @Body() versionDto: CreateNewVersionDto,
  ): Promise<ApiResponse<Material>> {
    const data = await this.materialService.createNewVersion(id, versionDto);
    return new ApiResponse(data, 'New version created successfully');
  }

  @Get()
  @ApiOperation({ summary: '获取物料列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: MaterialQueryDto,
  ): Promise<ApiResponse<PaginatedResponse<Material>>> {
    const data = await this.materialService.findAll(pagination, filters);
    return new ApiResponse(data);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取物料统计' })
  async getStats(@Query('projectId') projectId?: string): Promise<ApiResponse<any>> {
    const data = await this.materialService.getMaterialStats(projectId);
    return new ApiResponse(data);
  }

  @Get('versions/:materialNo')
  @ApiOperation({ summary: '获取物料版本历史' })
  async findVersions(@Param('materialNo') materialNo: string): Promise<ApiResponse<Material[]>> {
    const data = await this.materialService.findVersions(materialNo);
    return new ApiResponse(data);
  }

  @Get('export')
  @ApiOperation({ summary: '导出物料清单' })
  async export(
    @Query() filters: MaterialQueryDto,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res: Response,
  ): Promise<void> {
    const pagination = new PaginationQueryDto();
    pagination.pageSize = 10000;
    const result = await this.materialService.findAll(pagination, filters);

    const columns: ExportColumn[] = [
      { header: '物料编号', key: 'materialNo', width: 20 },
      { header: '版本', key: 'version', width: 8 },
      { header: '项目', key: 'projectName', width: 20 },
      { header: '供应商', key: 'supplierName', width: 15 },
      { header: '物料名称', key: 'name', width: 20 },
      { header: '分类', key: 'category', width: 12 },
      { header: '规格', key: 'specification', width: 20 },
      { header: '数量', key: 'quantity', width: 10 },
      { header: '单位', key: 'unit', width: 8 },
      { header: '单价', key: 'unitPrice', width: 12 },
      { header: '总价', key: 'totalPrice', width: 12 },
      { header: '状态', key: 'status', width: 12 },
    ];

    const exportData = result.items.map((item: any) => ({
      materialNo: item.materialNo,
      version: item.version,
      projectName: item.project?.name || '',
      supplierName: item.supplier?.name || '',
      name: item.name,
      category: item.category || '',
      specification: item.specification || '',
      quantity: item.quantity,
      unit: item.unit || '',
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      status: item.status,
    }));

    if (format === 'csv') {
      const csv = this.exportService.exportToCsv(exportData, columns);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=materials.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = await this.exportService.exportToExcel(exportData, columns, '物料清单');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=materials.xlsx');
      res.send(buffer);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取物料详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Material>> {
    const data = await this.materialService.findOne(id);
    return new ApiResponse(data);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取物料状态历史' })
  async getStatusHistory(@Param('id') id: string): Promise<ApiResponse<any[]>> {
    const data = await this.materialService.getStatusHistory(id);
    return new ApiResponse(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新物料' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaterialDto,
  ): Promise<ApiResponse<Material>> {
    const data = await this.materialService.update(id, updateDto);
    return new ApiResponse(data, 'Material updated successfully');
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新物料状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateMaterialStatusDto,
  ): Promise<ApiResponse<Material>> {
    const data = await this.materialService.updateStatus(id, statusDto);
    return new ApiResponse(data, 'Material status updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除物料' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.materialService.remove(id);
  }
}
