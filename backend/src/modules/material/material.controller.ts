import { Controller, Get, Post, Put, Body, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialStatusDto } from './dto/update-material-status.dto';
import { UploadVersionDto } from './dto/upload-version.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('materials')
@Controller('materials')
@UseFilters(BusinessExceptionFilter)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @ApiOperation({ summary: '创建材料' })
  create(@Body() createDto: CreateMaterialDto) {
    return this.materialService.create(
      createDto,
      createDto.operatorId,
      createDto.operatorName,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取材料列表' })
  findAll(@Query() query: QueryMaterialDto) {
    return this.materialService.findAll(query.page, query.limit, {
      status: query.status,
      workOrderId: query.workOrderId,
      ownerId: query.ownerId,
      type: query.type,
    });
  }

  @Get('deadlines/check')
  @ApiOperation({ summary: '检查即将到期的材料' })
  checkDeadlines() {
    return this.materialService.checkDeadlines();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取材料详情' })
  findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '获取材料版本历史' })
  getVersions(@Param('id') id: string) {
    return this.materialService.getVersions(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新材料状态' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaterialStatusDto,
  ) {
    return this.materialService.updateStatus(
      id,
      updateDto.status,
      updateDto.operatorId,
      updateDto.operatorName,
    );
  }

  @Post(':id/versions')
  @ApiOperation({ summary: '上传新版本' })
  uploadVersion(
    @Param('id') id: string,
    @Body() dto: UploadVersionDto,
  ) {
    return this.materialService.uploadNewVersion(
      id,
      dto.fileUrl,
      dto.changeLog,
      dto.operatorId,
      dto.operatorName,
    );
  }
}
