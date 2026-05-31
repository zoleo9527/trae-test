import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignOff } from './entities/sign-off.entity';
import { CreateSignOffDto } from './dto/create-sign-off.dto';
import { ActionSignOffDto } from './dto/action-sign-off.dto';
import { User } from '../user/entities/user.entity';
import { SignOffStatus, SignOffAction } from '../common/enums/sign-off.enum';
import { AuditService, AuditAction, AuditEntityType } from '../audit/audit.service';

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

  async sign(id: string, actionDto: ActionSignOffDto, user: User): Promise<SignOff> {
    const signOff = await this.findOne(id);

    if (signOff.status !== SignOffStatus.PENDING) {
      throw new BadRequestException('只能签认待处理的记录');
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
    return this.signOffRepository.find({
      where: { status: SignOffStatus.PENDING },
      relations: ['requestedBy', 'changeOrder', 'dailyReport', 'delivery'],
      order: { createdAt: 'DESC' },
    });
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
