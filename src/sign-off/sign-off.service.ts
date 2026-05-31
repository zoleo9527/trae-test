import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { SignOff } from './entities/sign-off.entity';
import { ChangeOrder } from '../change-order/entities/change-order.entity';
import { CreateSignOffDto } from './dto/create-sign-off.dto';
import { ActionSignOffDto } from './dto/action-sign-off.dto';
import { User } from '../user/entities/user.entity';
import { SignOffStatus, SignOffType } from '../common/enums/sign-off.enum';
import { ChangeOrderStatus } from '../common/enums/change-order-status.enum';
import { AuditAction, AuditEntityType } from '../common/enums/audit.enum';
import { Role } from '../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SignOffService {
  constructor(
    @InjectRepository(SignOff)
    private signOffRepository: Repository<SignOff>,
    @InjectRepository(ChangeOrder)
    private changeOrderRepository: Repository<ChangeOrder>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateSignOffDto, user: User): Promise<SignOff> {
    let processVersion = 1;

    if (createDto.changeOrderId) {
      const changeOrder = await this.changeOrderRepository.findOne({
        where: { id: createDto.changeOrderId },
      });
      if (changeOrder) {
        processVersion = changeOrder.signOffProcessVersion;
      }
    }

    const signOff = this.signOffRepository.create({
      ...createDto,
      requestedById: user.id,
      requestedBy: user,
      status: SignOffStatus.PENDING,
      processVersion,
    });

    const saved = await this.signOffRepository.save(signOff);

    await this.auditService.createLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.SIGN_OFF,
      entityId: saved.id,
      entityName: `签认-${saved.signOffType}`,
      user,
      newValues: saved,
      description: '创建签认请求',
    });

    return this.findOne(saved.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: SignOffStatus;
      signOffType?: string;
    },
  ): Promise<{ data: SignOff[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.signOffRepository.createQueryBuilder('so')
      .leftJoinAndSelect('so.requestedBy', 'requestedBy')
      .leftJoinAndSelect('so.signedBy', 'signedBy');

    if (filters?.status) {
      queryBuilder.andWhere('so.status = :status', { status: filters.status });
    }

    if (filters?.signOffType) {
      queryBuilder.andWhere('so.signOffType = :signOffType', { signOffType: filters.signOffType });
    }

    const [data, total] = await queryBuilder
      .orderBy('so.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<SignOff> {
    const signOff = await this.signOffRepository.findOne({
      where: { id },
      relations: ['requestedBy', 'signedBy', 'changeOrder', 'dailyReport', 'delivery'],
    });

    if (!signOff) {
      throw new NotFoundException('签认记录不存在');
    }

    return signOff;
  }

  private canUserSign(signOff: SignOff, user: User): boolean {
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (signOff.signerRole && signOff.signerRole !== user.role) {
      return false;
    }

    if (signOff.signerDepartment && signOff.signerDepartment !== user.department) {
      return false;
    }

    return true;
  }

  async sign(id: string, actionDto: ActionSignOffDto, user: User): Promise<SignOff> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const signOff = await this.findOne(id);

      if (signOff.status !== SignOffStatus.PENDING) {
        throw new BadRequestException('只能签认待处理的记录');
      }

      if (!this.canUserSign(signOff, user)) {
        throw new ForbiddenException(
          `您没有权限签认此记录。需要角色: ${signOff.signerRole || '不限'}, 需要部门: ${signOff.signerDepartment || '不限'}`,
        );
      }

      signOff.status = SignOffStatus.SIGNED;
      signOff.signedById = user.id;
      signOff.signedBy = user;
      signOff.signedAt = new Date();
      signOff.comments = actionDto.comments;
      signOff.signature = actionDto.signature;

      const savedSignOff = await queryRunner.manager.save(signOff);

      if (signOff.signOffType === SignOffType.CHANGE_ORDER && signOff.changeOrderId) {
        await this.handleChangeOrderSignOffApproval(
          queryRunner,
          signOff,
          user,
        );
      }

      await queryRunner.commitTransaction();

      await this.auditService.createLog({
        action: AuditAction.SIGN_OFF,
        entityType: AuditEntityType.SIGN_OFF,
        entityId: id,
        entityName: `签认-${signOff.signOffType}`,
        user,
        oldValues: { status: SignOffStatus.PENDING },
        newValues: { status: SignOffStatus.SIGNED },
        description: '签认通过',
      });

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleChangeOrderSignOffApproval(
    queryRunner: QueryRunner,
    signOff: SignOff,
    user: User,
  ): Promise<void> {
    const changeOrder = await queryRunner.manager.findOne(ChangeOrder, {
      where: { id: signOff.changeOrderId },
    });

    if (!changeOrder) {
      return;
    }

    if (signOff.processVersion !== changeOrder.signOffProcessVersion) {
      return;
    }

    const currentProcessVersion = changeOrder.signOffProcessVersion;

    const sequenceToStatus: Record<number, ChangeOrderStatus> = {
      1: ChangeOrderStatus.UNDER_REVIEW,
      2: ChangeOrderStatus.APPROVED,
      3: ChangeOrderStatus.IN_PROGRESS,
    };

    const nextStatus = sequenceToStatus[signOff.sequenceOrder];
    if (nextStatus) {
      changeOrder.status = nextStatus;
      changeOrder.currentVersion += 1;

      if (nextStatus === ChangeOrderStatus.APPROVED) {
        changeOrder.approvedById = user.id;
        changeOrder.approvedDate = new Date();
      }

      await queryRunner.manager.save(changeOrder);

      await this.auditService.createLog({
        action: AuditAction.STATUS_CHANGE,
        entityType: AuditEntityType.CHANGE_ORDER,
        entityId: changeOrder.id,
        entityName: changeOrder.title,
        user,
        oldValues: { status: signOff.changeOrder?.status },
        newValues: { status: nextStatus },
        description: `签认通过，状态自动变更: ${signOff.changeOrder?.status} → ${nextStatus}`,
      });
    }

    const nextSequenceConfigs: Array<{
      sequence: number;
      signerRole: Role;
      signerDepartment: string;
      requiredStatus: ChangeOrderStatus;
      comments: string;
    }> = [
      {
        sequence: 2,
        signerRole: Role.PROJECT_MANAGER,
        signerDepartment: '工程部',
        requiredStatus: ChangeOrderStatus.UNDER_REVIEW,
        comments: '监理初审通过，需项目经理审核',
      },
      {
        sequence: 3,
        signerRole: Role.CLIENT,
        signerDepartment: '甲方项目部',
        requiredStatus: ChangeOrderStatus.APPROVED,
        comments: '项目内部审核通过，需甲方确认',
      },
    ];

    for (const config of nextSequenceConfigs) {
      if (signOff.sequenceOrder === config.sequence - 1) {
        const existingNextSignOff = await queryRunner.manager.findOne(SignOff, {
          where: {
            changeOrderId: changeOrder.id,
            sequenceOrder: config.sequence,
            processVersion: currentProcessVersion,
          },
        });

        if (!existingNextSignOff) {
          const nextSignOff = queryRunner.manager.create(SignOff, {
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

          await queryRunner.manager.save(nextSignOff);

          await this.auditService.createLog({
            action: AuditAction.CREATE,
            entityType: AuditEntityType.SIGN_OFF,
            entityId: nextSignOff.id,
            entityName: `签认-${SignOffType.CHANGE_ORDER}-${config.sequence}`,
            user,
            newValues: nextSignOff,
            description: `自动生成下一级签认: ${config.signerRole}`,
          });
        }
        break;
      }
    }
  }

  async reject(id: string, actionDto: ActionSignOffDto, user: User): Promise<SignOff> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const signOff = await this.findOne(id);

      if (signOff.status !== SignOffStatus.PENDING) {
        throw new BadRequestException('只能驳回待处理的记录');
      }

      if (!this.canUserSign(signOff, user)) {
        throw new ForbiddenException(
          `您没有权限驳回此记录。需要角色: ${signOff.signerRole || '不限'}, 需要部门: ${signOff.signerDepartment || '不限'}`,
        );
      }

      signOff.status = SignOffStatus.REJECTED;
      signOff.signedById = user.id;
      signOff.signedBy = user;
      signOff.signedAt = new Date();
      signOff.rejectReason = actionDto.rejectReason;
      signOff.comments = actionDto.comments;

      const savedSignOff = await queryRunner.manager.save(signOff);

      if (signOff.signOffType === SignOffType.CHANGE_ORDER && signOff.changeOrderId) {
        const changeOrder = await queryRunner.manager.findOne(ChangeOrder, {
          where: { id: signOff.changeOrderId },
        });

        if (changeOrder) {
          const oldStatus = changeOrder.status;
          changeOrder.status = ChangeOrderStatus.REJECTED;
          changeOrder.rejectReason = actionDto.rejectReason || '签认被驳回';
          changeOrder.currentVersion += 1;

          await queryRunner.manager.save(changeOrder);

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

          await this.auditService.createLog({
            action: AuditAction.STATUS_CHANGE,
            entityType: AuditEntityType.CHANGE_ORDER,
            entityId: changeOrder.id,
            entityName: changeOrder.title,
            user,
            oldValues: { status: oldStatus },
            newValues: { status: ChangeOrderStatus.REJECTED },
            description: `签认驳回，变更单状态自动变更: ${oldStatus} → rejected，原因: ${actionDto.rejectReason || '未说明原因'}`,
          });
        }
      }

      await queryRunner.commitTransaction();

      await this.auditService.createLog({
        action: AuditAction.SIGN_OFF_REJECT,
        entityType: AuditEntityType.SIGN_OFF,
        entityId: id,
        entityName: `签认-${signOff.signOffType}`,
        user,
        oldValues: { status: SignOffStatus.PENDING },
        newValues: { status: SignOffStatus.REJECTED },
        description: `签认驳回: ${actionDto.rejectReason || '未说明原因'}`,
      });

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByChangeOrder(changeOrderId: string): Promise<SignOff[]> {
    return this.signOffRepository.find({
      where: { changeOrderId },
      relations: ['requestedBy', 'signedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingForUser(user: User): Promise<SignOff[]> {
    const queryBuilder = this.signOffRepository.createQueryBuilder('so')
      .leftJoinAndSelect('so.requestedBy', 'requestedBy')
      .leftJoinAndSelect('so.changeOrder', 'changeOrder')
      .leftJoinAndSelect('so.dailyReport', 'dailyReport')
      .leftJoinAndSelect('so.delivery', 'delivery')
      .where('so.status = :status', { status: SignOffStatus.PENDING })
      .andWhere(
        '(so.changeOrderId IS NULL OR so.processVersion = changeOrder.signOffProcessVersion)',
      );

    if (user.role !== Role.ADMIN) {
      queryBuilder.andWhere(
        '(so.signerRole IS NULL OR so.signerRole = :userRole)',
        { userRole: user.role },
      );
      queryBuilder.andWhere(
        '(so.signerDepartment IS NULL OR so.signerDepartment = :userDepartment)',
        { userDepartment: user.department },
      );
    }

    return queryBuilder
      .orderBy('so.createdAt', 'DESC')
      .getMany();
  }

  async getMySigned(user: User): Promise<SignOff[]> {
    return this.signOffRepository.find({
      where: { signedById: user.id },
      relations: ['requestedBy', 'changeOrder'],
      order: { signedAt: 'DESC' },
    });
  }

  async getMyRequested(user: User): Promise<SignOff[]> {
    return this.signOffRepository.find({
      where: { requestedById: user.id },
      relations: ['signedBy', 'changeOrder'],
      order: { createdAt: 'DESC' },
    });
  }
}
