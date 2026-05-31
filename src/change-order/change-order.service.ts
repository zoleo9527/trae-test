import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { ChangeOrder } from './entities/change-order.entity';
import { ChangeOrderVersion } from './entities/change-order-version.entity';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { StatusTransitionDto } from './dto/status-transition.dto';
import { User } from '../user/entities/user.entity';
import { ChangeOrderStatus, ChangeOrderStatusFlow } from '../common/enums/change-order-status.enum';
import { AuditAction, AuditEntityType } from '../common/enums/audit.enum';
import { SignOffType, SignOffStatus } from '../common/enums/sign-off.enum';
import { Role } from '../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';
import { SignOff } from '../sign-off/entities/sign-off.entity';

@Injectable()
export class ChangeOrderService {
  constructor(
    @InjectRepository(ChangeOrder)
    private changeOrderRepository: Repository<ChangeOrder>,
    @InjectRepository(ChangeOrderVersion)
    private versionRepository: Repository<ChangeOrderVersion>,
    @InjectRepository(SignOff)
    private signOffRepository: Repository<SignOff>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const prefix = `CO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${random}`;
  }

  async create(createDto: CreateChangeOrderDto, user: User): Promise<ChangeOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const changeOrder = this.changeOrderRepository.create({
        ...createDto,
        orderNumber: this.generateOrderNumber(),
        createdById: user.id,
        createdBy: user,
      });

      const savedOrder = await queryRunner.manager.save(changeOrder);

      await this.createVersion(
        queryRunner,
        savedOrder,
        1,
        savedOrder,
        null,
        user,
        '创建变更单',
      );

      await queryRunner.commitTransaction();

      await this.auditService.createLog({
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CHANGE_ORDER,
        entityId: savedOrder.id,
        entityName: savedOrder.title,
        user,
        newValues: savedOrder,
        description: '创建变更单',
      });

      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: ChangeOrderStatus;
      projectId?: string;
      changeType?: string;
    },
  ): Promise<{ data: ChangeOrder[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.changeOrderRepository.createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy')
      .leftJoinAndSelect('co.approvedBy', 'approvedBy');

    if (filters?.status) {
      queryBuilder.andWhere('co.status = :status', { status: filters.status });
    }

    if (filters?.projectId) {
      queryBuilder.andWhere('co.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters?.changeType) {
      queryBuilder.andWhere('co.changeType = :changeType', { changeType: filters.changeType });
    }

    const [data, total] = await queryBuilder
      .orderBy('co.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ChangeOrder> {
    const changeOrder = await this.changeOrderRepository.findOne({
      where: { id },
      relations: ['createdBy', 'approvedBy', 'versions', 'signOffs', 'dailyReports', 'deliveries'],
    });

    if (!changeOrder) {
      throw new NotFoundException('变更单不存在');
    }

    return changeOrder;
  }

  async update(id: string, updateDto: UpdateChangeOrderDto, user: User): Promise<ChangeOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const changeOrder = await this.findOne(id);
      const oldValues = { ...changeOrder };

      if (changeOrder.status !== ChangeOrderStatus.DRAFT && changeOrder.status !== ChangeOrderStatus.REJECTED) {
        throw new BadRequestException('只能编辑草稿或已驳回的变更单');
      }

      Object.assign(changeOrder, updateDto);
      changeOrder.currentVersion += 1;

      const updatedOrder = await queryRunner.manager.save(changeOrder);

      await this.createVersion(
        queryRunner,
        updatedOrder,
        updatedOrder.currentVersion,
        updatedOrder,
        oldValues,
        user,
        '更新变更单',
      );

      await queryRunner.commitTransaction();

      await this.auditService.createLog({
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CHANGE_ORDER,
        entityId: id,
        entityName: updatedOrder.title,
        user,
        oldValues,
        newValues: updatedOrder,
        description: '更新变更单内容',
      });

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transitionStatus(
    id: string,
    transitionDto: StatusTransitionDto,
    user: User,
  ): Promise<ChangeOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const changeOrder = await this.findOne(id);
      const oldStatus = changeOrder.status;
      const { targetStatus, reason } = transitionDto;

      const allowedTransitions = ChangeOrderStatusFlow[changeOrder.status] || [];
      if (!allowedTransitions.includes(targetStatus)) {
        throw new BadRequestException(
          `无法从 ${changeOrder.status} 转换到 ${targetStatus}，允许的转换: ${allowedTransitions.join(', ')}`,
        );
      }

      await this.checkPendingSignOffs(changeOrder, targetStatus, user);

      changeOrder.status = targetStatus;
      changeOrder.currentVersion += 1;

      if (targetStatus === ChangeOrderStatus.APPROVED) {
        changeOrder.approvedById = user.id;
        changeOrder.approvedBy = user;
        changeOrder.approvedDate = new Date();
      } else if (targetStatus === ChangeOrderStatus.REJECTED) {
        changeOrder.rejectReason = reason;
      } else if (targetStatus === ChangeOrderStatus.COMPLETED) {
        changeOrder.completedDate = new Date();
      } else if (targetStatus === ChangeOrderStatus.SETTLED) {
        changeOrder.settledDate = new Date();
      }

      const updatedOrder = await queryRunner.manager.save(changeOrder);

      await this.createVersion(
        queryRunner,
        updatedOrder,
        updatedOrder.currentVersion,
        updatedOrder,
        { status: oldStatus },
        user,
        `状态变更: ${oldStatus} → ${targetStatus}`,
      );

      await this.autoGenerateSignOffs(
        queryRunner,
        updatedOrder,
        oldStatus,
        targetStatus,
        user,
      );

      await queryRunner.commitTransaction();

      await this.auditService.createLog({
        action: AuditAction.STATUS_CHANGE,
        entityType: AuditEntityType.CHANGE_ORDER,
        entityId: id,
        entityName: updatedOrder.title,
        user,
        oldValues: { status: oldStatus },
        newValues: { status: targetStatus },
        description: `状态变更: ${oldStatus} → ${targetStatus}${reason ? `，原因: ${reason}` : ''}`,
      });

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async autoGenerateSignOffs(
    queryRunner: QueryRunner,
    changeOrder: ChangeOrder,
    oldStatus: ChangeOrderStatus,
    targetStatus: ChangeOrderStatus,
    user: User,
  ): Promise<void> {
    if (oldStatus === ChangeOrderStatus.REJECTED && targetStatus === ChangeOrderStatus.SUBMITTED) {
      changeOrder.signOffProcessVersion += 1;
      await queryRunner.manager.save(changeOrder);
    }

    const currentProcessVersion = changeOrder.signOffProcessVersion;

    const signOffConfigs: Array<{
      triggerStatus: ChangeOrderStatus;
      signerRole: Role;
      signerDepartment: string;
      sequence: number;
      comments: string;
    }> = [
      {
        triggerStatus: ChangeOrderStatus.SUBMITTED,
        signerRole: Role.SUPERVISOR,
        signerDepartment: '监理部',
        sequence: 1,
        comments: '变更单提交后，需监理初审',
      },
      {
        triggerStatus: ChangeOrderStatus.UNDER_REVIEW,
        signerRole: Role.PROJECT_MANAGER,
        signerDepartment: '工程部',
        sequence: 2,
        comments: '监理初审通过后，需项目经理审核',
      },
      {
        triggerStatus: ChangeOrderStatus.APPROVED,
        signerRole: Role.CLIENT,
        signerDepartment: '甲方项目部',
        sequence: 3,
        comments: '项目内部审核通过后，需甲方确认',
      },
    ];

    for (const config of signOffConfigs) {
      if (targetStatus === config.triggerStatus) {
        const existingSignOff = await queryRunner.manager.findOne(SignOff, {
          where: {
            changeOrderId: changeOrder.id,
            signerRole: config.signerRole,
            sequenceOrder: config.sequence,
            processVersion: currentProcessVersion,
          },
        });

        if (!existingSignOff) {
          const signOff = queryRunner.manager.create(SignOff, {
            signOffType: SignOffType.CHANGE_ORDER,
            changeOrderId: changeOrder.id,
            changeOrder,
            requestedById: user.id,
            requestedBy: user,
            status: SignOffStatus.PENDING,
            sequenceOrder: config.sequence,
            comments: config.comments,
            signerRole: config.signerRole,
            signerDepartment: config.signerDepartment,
            processVersion: currentProcessVersion,
          });

          await queryRunner.manager.save(signOff);
        }
      }
    }

    if (targetStatus === ChangeOrderStatus.REJECTED) {
      await queryRunner.manager.update(
        SignOff,
        {
          changeOrderId: changeOrder.id,
          status: SignOffStatus.PENDING,
        },
        {
          status: SignOffStatus.REJECTED,
          signedById: user.id,
          signedBy: user,
          signedAt: new Date(),
          rejectReason: '变更单被驳回',
        },
      );
    }
  }

  private async checkPendingSignOffs(
    changeOrder: ChangeOrder,
    targetStatus: ChangeOrderStatus,
    user: User,
  ): Promise<void> {
    const bypassStatuses = [
      ChangeOrderStatus.DRAFT,
      ChangeOrderStatus.REJECTED,
      ChangeOrderStatus.CANCELLED,
    ];

    if (bypassStatuses.includes(changeOrder.status)) {
      return;
    }

    const finalStatuses = [
      ChangeOrderStatus.REJECTED,
      ChangeOrderStatus.CANCELLED,
    ];

    if (finalStatuses.includes(targetStatus)) {
      return;
    }

    const currentProcessVersion = changeOrder.signOffProcessVersion;

    const pendingSignOffs = await this.signOffRepository.find({
      where: {
        changeOrderId: changeOrder.id,
        status: SignOffStatus.PENDING,
        processVersion: currentProcessVersion,
      },
    });

    if (pendingSignOffs.length > 0) {
      const pendingRoles = pendingSignOffs.map((s) => s.signerRole).join(', ');
      throw new BadRequestException(
        `当前存在待签认记录（第${currentProcessVersion}轮流程），无法直接推进状态。请先完成以下角色的签认: ${pendingRoles}，或通过签认接口自动推进状态。`,
      );
    }
  }

  private async createVersion(
    queryRunner: QueryRunner,
    changeOrder: ChangeOrder,
    versionNumber: number,
    newData: any,
    oldData: any | null,
    user: User,
    summary: string,
  ): Promise<ChangeOrderVersion> {
    const changes = oldData ? this.calculateChanges(oldData, newData) : [];

    const version = this.versionRepository.create({
      changeOrderId: changeOrder.id,
      changeOrder,
      versionNumber,
      snapshotData: JSON.parse(JSON.stringify(newData)),
      changeSummary: summary,
      changes,
      createdById: user.id,
      createdBy: user,
    });

    return queryRunner.manager.save(version);
  }

  private calculateChanges(oldData: any, newData: any): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    const ignoredFields = ['createdAt', 'updatedAt', 'deletedAt', 'versions'];

    for (const field of allFields) {
      if (ignoredFields.includes(field)) continue;

      const oldValue = oldData[field];
      const newValue = newData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue });
      }
    }

    return changes;
  }

  async getVersions(id: string): Promise<ChangeOrderVersion[]> {
    await this.findOne(id);

    return this.versionRepository.find({
      where: { changeOrderId: id },
      relations: ['createdBy'],
      order: { versionNumber: 'DESC' },
    });
  }

  async getVersion(id: string, versionNumber: number): Promise<ChangeOrderVersion> {
    const version = await this.versionRepository.findOne({
      where: { changeOrderId: id, versionNumber },
      relations: ['createdBy'],
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    return version;
  }

  async getPendingForUser(user: User): Promise<ChangeOrder[]> {
    const queryBuilder = this.changeOrderRepository.createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy')
      .where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
        ],
      })
      .orderBy('co.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async getRejectedForUser(user: User): Promise<ChangeOrder[]> {
    return this.changeOrderRepository.find({
      where: {
        status: ChangeOrderStatus.REJECTED,
      },
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getNeedsReview(user: User): Promise<ChangeOrder[]> {
    return this.changeOrderRepository
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy')
      .leftJoin('co.signOffs', 'so', 'so.processVersion = co.signOffProcessVersion')
      .where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      })
      .andWhere('(so.status IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' })
      .orderBy('co.createdAt', 'DESC')
      .getMany();
  }

  async getStatistics(): Promise<any> {
    const result = await this.changeOrderRepository
      .createQueryBuilder('co')
      .select('co.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('co.status')
      .getRawMany();

    const statistics: any = {};
    for (const status of Object.values(ChangeOrderStatus)) {
      statistics[status] = 0;
    }

    for (const row of result) {
      statistics[row.status] = parseInt(row.count, 10);
    }

    return statistics;
  }
}
