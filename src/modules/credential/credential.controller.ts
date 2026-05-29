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
import { CredentialService } from './credential.service';
import {
  CreateCredentialDto,
  UpdateCredentialDto,
  UpdateCredentialStatusDto,
  CredentialQueryDto,
} from './dto/credential.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { Credential } from '../../entities/credential.entity';
import { ExportService, ExportColumn } from '../../common/services/export.service';
import { CredentialType } from '../../common/enums/credential.enum';

@ApiTags('credentials')
@Controller('api/credentials')
export class CredentialController {
  constructor(
    private readonly credentialService: CredentialService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建进场证件' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCredentialDto): Promise<ApiResponse<Credential>> {
    const data = await this.credentialService.create(createDto);
    return new ApiResponse(data, 'Credential created successfully');
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建进场证件' })
  async batchCreate(
    @Body() body: { projectId: string; personIds: string[]; type: CredentialType },
  ): Promise<ApiResponse<Credential[]>> {
    const data = await this.credentialService.batchCreate(body.projectId, body.personIds, body.type);
    return new ApiResponse(data, 'Credentials created successfully');
  }

  @Get()
  @ApiOperation({ summary: '获取进场证件列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: CredentialQueryDto,
  ): Promise<ApiResponse<PaginatedResponse<Credential>>> {
    const data = await this.credentialService.findAll(pagination, filters);
    return new ApiResponse(data);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取证件统计' })
  async getStats(@Query('projectId') projectId?: string): Promise<ApiResponse<any>> {
    const data = await this.credentialService.getCredentialStats(projectId);
    return new ApiResponse(data);
  }

  @Get('export')
  @ApiOperation({ summary: '导出证件列表' })
  async export(
    @Query() filters: CredentialQueryDto,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res: Response,
  ): Promise<void> {
    const pagination = new PaginationQueryDto();
    pagination.pageSize = 10000;
    const result = await this.credentialService.findAll(pagination, filters);

    const columns: ExportColumn[] = [
      { header: '证件编号', key: 'credentialNo', width: 20 },
      { header: '项目', key: 'projectName', width: 20 },
      { header: '人员姓名', key: 'personName', width: 15 },
      { header: '证件类型', key: 'type', width: 15 },
      { header: '状态', key: 'status', width: 12 },
      { header: '有效期开始', key: 'validFrom', width: 20 },
      { header: '有效期结束', key: 'validTo', width: 20 },
    ];

    const exportData = result.items.map((item: any) => ({
      credentialNo: item.credentialNo,
      projectName: item.project?.name || '',
      personName: item.person?.name || '',
      type: item.type,
      status: item.status,
      validFrom: item.validFrom?.toISOString().split('T')[0] || '',
      validTo: item.validTo?.toISOString().split('T')[0] || '',
    }));

    if (format === 'csv') {
      const csv = this.exportService.exportToCsv(exportData, columns);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=credentials.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = await this.exportService.exportToExcel(exportData, columns, '证件列表');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=credentials.xlsx');
      res.send(buffer);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取进场证件详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Credential>> {
    const data = await this.credentialService.findOne(id);
    return new ApiResponse(data);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取证件状态历史' })
  async getStatusHistory(@Param('id') id: string): Promise<ApiResponse<any[]>> {
    const data = await this.credentialService.getStatusHistory(id);
    return new ApiResponse(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新进场证件' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCredentialDto,
  ): Promise<ApiResponse<Credential>> {
    const data = await this.credentialService.update(id, updateDto);
    return new ApiResponse(data, 'Credential updated successfully');
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新进场证件状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateCredentialStatusDto,
  ): Promise<ApiResponse<Credential>> {
    const data = await this.credentialService.updateStatus(id, statusDto);
    return new ApiResponse(data, 'Credential status updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除进场证件' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.credentialService.remove(id);
  }
}
