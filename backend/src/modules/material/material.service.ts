import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './material.entity';
import { MaterialVersion } from './material-version.entity';
import { MaterialStatus } from '../../common/enums/material-status.enum';
import { MaterialStateMachine } from '../../common/state-machines/material.state-machine';
import { createError, ErrorCode } from '../../common/errors/business-error';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(MaterialVersion)
    private readonly materialVersionRepository: Repository<MaterialVersion>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<Material>, operatorId: string, operatorName: string): Promise<Material> {
    const material = this.materialRepository.create({
      ...data,
      status: MaterialStatus.DRAFT,
      currentVersion: 1,
      createdBy: operatorId,
      updatedBy: operatorId,
    });

    const saved = await this.materialRepository.save(material);

    if (data.fileUrl) {
      await this.createVersion(saved.id, 1, data.fileUrl, '初始版本', operatorId);
    }

    await this.auditService.log(
      'Material',
      saved.id,
      'CREATE',
      null,
      saved,
      operatorId,
      operatorName,
      '创建材料',
    );

    return this.findOne(saved.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: MaterialStatus;
      workOrderId?: string;
      ownerId?: string;
      type?: string;
    },
  ): Promise<{ data: Material[]; total: number }> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.workOrderId) where.workOrderId = filters.workOrderId;
    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.type) where.type = filters.type;

    const [data, total] = await this.materialRepository.findAndCount({
      where,
      relations: ['owner', 'versions', 'versions.uploader'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: [
        'workOrder',
        'workOrder.student',
        'owner',
        'versions',
        'versions.uploader',
        'comments',
        'comments.author',
      ],
    });

    if (!material) {
      throw createError(ErrorCode.MATERIAL_NOT_FOUND, `材料 ${id} 不存在`);
    }

    return material;
  }

  async updateStatus(
    id: string,
    newStatus: MaterialStatus,
    operatorId: string,
    operatorName: string,
  ): Promise<Material> {
    const material = await this.findOne(id);
    const oldStatus = material.status;

    MaterialStateMachine.transition(oldStatus, newStatus);

    const oldValue = { ...material };
    material.status = newStatus;
    material.updatedBy = operatorId;
    const saved = await this.materialRepository.save(material);

    await this.auditService.log(
      'Material',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status: newStatus },
      operatorId,
      operatorName,
      `材料状态从 ${oldStatus} 变更为 ${newStatus}`,
    );

    return this.findOne(id);
  }

  async uploadNewVersion(
    id: string,
    fileUrl: string,
    changeLog: string,
    operatorId: string,
    operatorName: string,
  ): Promise<Material> {
    const material = await this.findOne(id);
    const newVersion = material.currentVersion + 1;

    await this.createVersion(id, newVersion, fileUrl, changeLog, operatorId);

    material.currentVersion = newVersion;
    material.fileUrl = fileUrl;
    material.updatedBy = operatorId;
    material.status = MaterialStatus.SUBMITTED;

    const saved = await this.materialRepository.save(material);

    await this.auditService.log(
      'Material',
      id,
      'NEW_VERSION',
      { version: material.currentVersion - 1 },
      { version: newVersion },
      operatorId,
      operatorName,
      `上传新版本 v${newVersion}`,
    );

    return this.findOne(id);
  }

  private async createVersion(
    materialId: string,
    version: number,
    fileUrl: string,
    changeLog: string,
    uploadedBy: string,
  ): Promise<MaterialVersion> {
    const materialVersion = this.materialVersionRepository.create({
      materialId,
      version,
      fileUrl,
      changeLog,
      uploadedBy,
    });
    return this.materialVersionRepository.save(materialVersion);
  }

  async getVersions(materialId: string): Promise<MaterialVersion[]> {
    return this.materialVersionRepository.find({
      where: { materialId },
      relations: ['uploader'],
      order: { version: 'DESC' },
    });
  }

  async checkDeadlines(): Promise<Material[]> {
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    return this.materialRepository
      .createQueryBuilder('material')
      .where('material.deadline <= :threeDaysLater', { threeDaysLater })
      .andWhere('material.deadline >= :today', { today })
      .andWhere('material.status NOT IN (:...completedStatuses)', {
        completedStatuses: [MaterialStatus.APPROVED, MaterialStatus.EXPIRED],
      })
      .getMany();
  }
}
