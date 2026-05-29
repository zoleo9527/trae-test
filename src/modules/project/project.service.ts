import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { ProjectStatus, ProjectStatusTransitions, ProjectPhase } from '../../common/enums/project.enum';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
  ProjectQueryDto,
} from './dto/project.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { QueryBuilderService } from '../../common/services/query-builder.service';
import { StateMachineService } from '../../common/services/state-machine.service';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private queryBuilderService: QueryBuilderService,
    private stateMachineService: StateMachineService,
  ) {}

  async create(createDto: CreateProjectDto): Promise<Project> {
    const existing = await this.projectRepository.findOne({
      where: { projectNo: createDto.projectNo },
    });

    if (existing) {
      throw new BusinessException(
        `Project with number ${createDto.projectNo} already exists`,
        ErrorCode.DUPLICATE_RESOURCE,
      );
    }

    const project = this.projectRepository.create(createDto);
    return this.projectRepository.save(project);
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: ProjectQueryDto,
  ): Promise<PaginatedResponse<Project>> {
    const qb = this.projectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.supplier', 'supplier');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, ['name', 'projectNo', 'venue', 'boothNo'], 'project');

    if (filters.status) {
      qb.andWhere('project.status = :status', { status: filters.status });
    }

    if (filters.currentPhase) {
      qb.andWhere('project.currentPhase = :currentPhase', { currentPhase: filters.currentPhase });
    }

    if (filters.supplierId) {
      qb.andWhere('project.supplierId = :supplierId', { supplierId: filters.supplierId });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'project');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['supplier', 'credentials', 'materials', 'settlements', 'checkinRecords'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async findByProjectNo(projectNo: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { projectNo },
      relations: ['supplier'],
    });

    if (!project) {
      throw new NotFoundException(`Project with number ${projectNo} not found`);
    }

    return project;
  }

  async update(id: string, updateDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateDto);
    return this.projectRepository.save(project);
  }

  async updateStatus(
    id: string,
    statusDto: UpdateProjectStatusDto,
  ): Promise<Project> {
    const project = await this.findOne(id);

    this.stateMachineService.ensureValidTransition(
      project.status,
      statusDto.status,
      ProjectStatusTransitions,
      'project',
    );

    if (project.status !== statusDto.status) {
      await this.stateMachineService.logStatusChange(
        'project',
        project.id,
        project.status,
        statusDto.status,
        statusDto.operator,
        statusDto.remark,
        project.id,
      );
    }

    project.status = statusDto.status;
    return this.projectRepository.save(project);
  }

  async updatePhase(id: string, phase: ProjectPhase, operator?: string): Promise<Project> {
    const project = await this.findOne(id);

    if (project.currentPhase !== phase) {
      await this.stateMachineService.logStatusChange(
        'project',
        project.id,
        project.currentPhase || 'none',
        phase,
        operator,
        'Phase transition',
        project.id,
      );
    }

    project.currentPhase = phase;
    return this.projectRepository.save(project);
  }

  async getProjectDashboard(id: string): Promise<any> {
    const project = await this.findOne(id);

    const credentialStats = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.credentials', 'credential')
      .select([
        'COUNT(DISTINCT credential.id) as totalCredentials',
        "COUNT(DISTINCT CASE WHEN credential.status = 'approved' THEN credential.id END) as approvedCredentials",
        "COUNT(DISTINCT CASE WHEN credential.status = 'issued' THEN credential.id END) as issuedCredentials",
      ])
      .where('project.id = :id', { id })
      .getRawOne();

    const checkinStats = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.checkinRecords', 'checkin')
      .select([
        'COUNT(DISTINCT checkin.id) as totalCheckins',
        "COUNT(DISTINCT CASE WHEN checkin.type = 'entry' AND DATE(checkin.checkinTime) = CURRENT_DATE THEN checkin.id END) as todayCheckins",
      ])
      .where('project.id = :id', { id })
      .getRawOne();

    const materialStats = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.materials', 'material')
      .select([
        'COUNT(DISTINCT material.id) as totalMaterials',
        "COUNT(DISTINCT CASE WHEN material.status = 'approved' THEN material.id END) as approvedMaterials",
        "COUNT(DISTINCT CASE WHEN material.status = 'delivered' THEN material.id END) as deliveredMaterials",
        'SUM(material.totalPrice) as totalMaterialCost',
      ])
      .where('project.id = :id', { id })
      .getRawOne();

    return {
      project,
      credentials: {
        total: parseInt(credentialStats.totalcredentials || 0),
        approved: parseInt(credentialStats.approvedcredentials || 0),
        issued: parseInt(credentialStats.issuedcredentials || 0),
      },
      checkins: {
        total: parseInt(checkinStats.totalcheckins || 0),
        today: parseInt(checkinStats.todaycheckins || 0),
      },
      materials: {
        total: parseInt(materialStats.totalmaterials || 0),
        approved: parseInt(materialStats.approvedmaterials || 0),
        delivered: parseInt(materialStats.deliveredmaterials || 0),
        totalCost: parseFloat(materialStats.totalmaterialcost || 0),
      },
    };
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.projectRepository.delete(id);
  }
}
