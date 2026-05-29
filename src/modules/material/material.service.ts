import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../../../entities/material.entity';
import { MaterialStatus, MaterialStatusTransitions } from '../../../common/enums/material.enum';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  UpdateMaterialStatusDto,
  MaterialQueryDto,
  CreateNewVersionDto,
} from './dto/material.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../../common/dto/response.dto';
import { QueryBuilderService } from '../../../common/services/query-builder.service';
import { StateMachineService } from '../../../common/services/state-machine.service';
import { BusinessException, ErrorCode } from '../../../common/filters/http-exception.filter';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private queryBuilderService: QueryBuilderService,
    private stateMachineService: StateMachineService,
  ) {}

  async create(createDto: CreateMaterialDto): Promise<Material> {
    const material = this.materialRepository.create({
      ...createDto,
      materialNo: await this.generateMaterialNo(createDto.projectId),
      version: 1,
      status: MaterialStatus.DRAFT,
    });

    return this.materialRepository.save(material);
  }

  private async generateMaterialNo(projectId: string): Promise<string> {
    const count = await this.materialRepository.count({ where: { projectId } });
    const seq = (count + 1).toString().padStart(4, '0');
    const projectShort = projectId.substring(0, 8).toUpperCase();
    return `MAT-${projectShort}-${seq}`;
  }

  async createNewVersion(id: string, versionDto: CreateNewVersionDto): Promise<Material> {
    const oldMaterial = await this.findOne(id);

    if (oldMaterial.status === MaterialStatus.DRAFT) {
      Object.assign(oldMaterial, versionDto);
      return this.materialRepository.save(oldMaterial);
    }

    const newVersion = oldMaterial.version + 1;
    const newMaterial = this.materialRepository.create({
      projectId: oldMaterial.projectId,
      supplierId: oldMaterial.supplierId,
      name: oldMaterial.name,
      category: oldMaterial.category,
      specification: versionDto.specification || oldMaterial.specification,
      quantity: versionDto.quantity !== undefined ? versionDto.quantity : oldMaterial.quantity,
      unit: oldMaterial.unit,
      unitPrice: versionDto.unitPrice !== undefined ? versionDto.unitPrice : oldMaterial.unitPrice,
      totalPrice: oldMaterial.totalPrice,
      materialNo: oldMaterial.materialNo,
      version: newVersion,
      status: MaterialStatus.DRAFT,
      remark: versionDto.remark,
    });

    return this.materialRepository.save(newMaterial);
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: MaterialQueryDto,
  ): Promise<PaginatedResponse<Material>> {
    const qb = this.materialRepository.createQueryBuilder('material')
      .leftJoinAndSelect('material.project', 'project')
      .leftJoinAndSelect('material.supplier', 'supplier');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, ['name', 'materialNo', 'category', 'specification'], 'material');

    if (filters.projectId) {
      qb.andWhere('material.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.supplierId) {
      qb.andWhere('material.supplierId = :supplierId', { supplierId: filters.supplierId });
    }

    if (filters.category) {
      qb.andWhere('material.category = :category', { category: filters.category });
    }

    if (filters.status) {
      qb.andWhere('material.status = :status', { status: filters.status });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'material');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['project', 'supplier', 'statusLogs'],
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async findVersions(materialNo: string): Promise<Material[]> {
    return this.materialRepository.find({
      where: { materialNo },
      order: { version: 'DESC' },
      relations: ['supplier'],
    });
  }

  async update(id: string, updateDto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);

    if (material.status !== MaterialStatus.DRAFT && material.status !== MaterialStatus.REJECTED) {
      throw new BusinessException(
        'Can only update material in DRAFT or REJECTED status',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    Object.assign(material, updateDto);
    return this.materialRepository.save(material);
  }

  async updateStatus(
    id: string,
    statusDto: UpdateMaterialStatusDto,
  ): Promise<Material> {
    const material = await this.findOne(id);

    this.stateMachineService.ensureValidTransition(
      material.status,
      statusDto.status,
      MaterialStatusTransitions,
      'material',
    );

    if (material.status !== statusDto.status) {
      await this.stateMachineService.logStatusChange(
        'material',
        material.id,
        material.status,
        statusDto.status,
        statusDto.operator,
        statusDto.reviewRemark,
        material.projectId,
      );
    }

    material.status = statusDto.status;

    if (statusDto.reviewRemark) {
      material.reviewRemark = statusDto.reviewRemark;
    }

    if (statusDto.status === MaterialStatus.APPROVED || statusDto.status === MaterialStatus.REJECTED) {
      material.reviewer = statusDto.operator;
      material.reviewedAt = new Date();
    }

    if (statusDto.status === MaterialStatus.DELIVERED) {
      material.actualDeliveryDate = new Date();
      material.receiver = statusDto.receiver;
    }

    return this.materialRepository.save(material);
  }

  async getStatusHistory(id: string): Promise<any[]> {
    return this.stateMachineService.getStatusHistory('material', id);
  }

  async getMaterialStats(projectId?: string): Promise<any> {
    const qb = this.materialRepository
      .createQueryBuilder('material')
      .select([
        'material.status as status',
        'COUNT(*) as count',
        'SUM(material.totalPrice) as totalPrice',
      ]);

    if (projectId) {
      qb.where('material.projectId = :projectId', { projectId });
    }

    const stats = await qb
      .groupBy('material.status')
      .getRawMany();

    const result: Record<string, { count: number; amount: number }> = {};
    Object.values(MaterialStatus).forEach((status) => {
      result[status] = { count: 0, amount: 0 };
    });

    stats.forEach((stat) => {
      result[stat.status] = {
        count: parseInt(stat.count, 10),
        amount: parseFloat(stat.totalprice || 0),
      };
    });

    return result;
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);

    if (material.status !== MaterialStatus.DRAFT) {
      throw new BusinessException(
        'Can only delete material in DRAFT status',
        ErrorCode.OPERATION_NOT_ALLOWED,
      );
    }

    await this.materialRepository.delete(id);
  }
}
