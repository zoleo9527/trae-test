import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
  UpdateProjectPhaseDto,
  ProjectQueryDto,
} from './dto/project.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { Project } from '../../entities/project.entity';

@ApiTags('projects')
@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateProjectDto): Promise<ApiResponse<Project>> {
    const data = await this.projectService.create(createDto);
    return new ApiResponse(data, 'Project created successfully');
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: ProjectQueryDto,
  ): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const data = await this.projectService.findAll(pagination, filters);
    return new ApiResponse(data);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Project>> {
    const data = await this.projectService.findOne(id);
    return new ApiResponse(data);
  }

  @Get('no/:projectNo')
  @ApiOperation({ summary: '根据项目编号获取项目' })
  async findByProjectNo(@Param('projectNo') projectNo: string): Promise<ApiResponse<Project>> {
    const data = await this.projectService.findByProjectNo(projectNo);
    return new ApiResponse(data);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: '获取项目看板数据' })
  async getDashboard(@Param('id') id: string): Promise<ApiResponse<any>> {
    const data = await this.projectService.getProjectDashboard(id);
    return new ApiResponse(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectDto,
  ): Promise<ApiResponse<Project>> {
    const data = await this.projectService.update(id, updateDto);
    return new ApiResponse(data, 'Project updated successfully');
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新项目状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateProjectStatusDto,
  ): Promise<ApiResponse<Project>> {
    const data = await this.projectService.updateStatus(id, statusDto);
    return new ApiResponse(data, 'Project status updated successfully');
  }

  @Put(':id/phase')
  @ApiOperation({ summary: '更新项目阶段' })
  async updatePhase(
    @Param('id') id: string,
    @Body() phaseDto: UpdateProjectPhaseDto,
  ): Promise<ApiResponse<Project>> {
    const data = await this.projectService.updatePhase(id, phaseDto.phase, phaseDto.operator);
    return new ApiResponse(data, 'Project phase updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.projectService.remove(id);
  }
}
