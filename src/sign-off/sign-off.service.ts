import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignOff } from './entities/sign-off.entity';
import { CreateSignOffDto } from './dto/create-sign-off.dto';
import { ActionSignOffDto } from './dto/action-sign-off.dto';
import { User } from '../user/entities/user.entity';
import { SignOffStatus } from '../common/enums/sign-off.enum';
import { AuditAction, AuditEntityType } from '../common/enums/audit.enum';
import { Role } from '../common/enums/role.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SignOffService {
  constructor(
    @InjectRepository(SignOff)
    private signOffRepository: Repository<SignOff>,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateSignOffDto, user: User): Promise<SignOff> {
    const signOff = this.signOffRepository.create({
      ...createDto,
      requestedById: user.id,
      requestedBy: user,
      status: SignOffStatus.PENDING,
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

    const saved = await this.signOffRepository.save(signOff);

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
  }

  async reject(id: string, actionDto: ActionSignOffDto, user: User): Promise<SignOff> {
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

    const saved = await this.signOffRepository.save(signOff);

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
      .where('so.status = :status', { status: SignOffStatus.PENDING });

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
