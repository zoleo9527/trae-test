import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member, User, AuditModule } from '../../database/entities';
import { AuditService } from '../../common/audit';

export interface CreateMemberDto {
  realName: string;
  phone: string;
  gender?: string;
  birthday?: Date;
  level?: string;
  remark?: string;
}

export interface UpdateMemberDto {
  realName?: string;
  phone?: string;
  gender?: string;
  birthday?: Date;
  level?: string;
  remark?: string;
}

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private auditService: AuditService,
  ) {}

  async generateMemberNo(): Promise<string> {
    const date = new Date();
    const prefix = `M${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const lastMember = await this.memberRepository
      .createQueryBuilder('m')
      .where('m.memberNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('m.memberNo', 'DESC')
      .getOne();

    if (lastMember) {
      const lastNum = parseInt(lastMember.memberNo.slice(-5));
      return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
    }

    return `${prefix}00001`;
  }

  async create(dto: CreateMemberDto, operator: User): Promise<Member> {
    const existing = await this.memberRepository.findOne({
      where: { phone: dto.phone, isDeleted: false },
    });

    if (existing) {
      throw new ConflictException('该手机号已存在会员记录');
    }

    const memberNo = await this.generateMemberNo();

    const member = this.memberRepository.create({
      memberNo,
      realName: dto.realName,
      phone: dto.phone,
      gender: dto.gender,
      birthday: dto.birthday,
      level: dto.level as any,
      remark: dto.remark,
      createdBy: operator.id,
      updatedBy: operator.id,
    });

    const saved = await this.memberRepository.save(member);

    await this.auditService.logCreate(
      AuditModule.MEMBER,
      saved.id,
      { ...saved },
      operator,
    );

    return saved;
  }

  async findAll(
    filters?: {
      keyword?: string;
      level?: string;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: Member[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.memberRepository
      .createQueryBuilder('m')
      .where('m.isDeleted = :isDeleted', { isDeleted: false });

    if (filters?.keyword) {
      queryBuilder.andWhere(
        '(m.realName LIKE :keyword OR m.phone LIKE :keyword OR m.memberNo LIKE :keyword)',
        { keyword: `%${filters.keyword}%` },
      );
    }
    if (filters?.level) {
      queryBuilder.andWhere('m.level = :level', { level: filters.level });
    }

    queryBuilder.orderBy('m.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['workOrders', 'followUps'],
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    return member;
  }

  async update(id: string, dto: UpdateMemberDto, operator: User): Promise<Member> {
    const member = await this.findOne(id);
    const oldValues = { ...member };

    if (dto.phone && dto.phone !== member.phone) {
      const existing = await this.memberRepository.findOne({
        where: { phone: dto.phone, isDeleted: false },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('该手机号已存在会员记录');
      }
    }

    Object.assign(member, dto);
    member.updatedBy = operator.id;

    const updated = await this.memberRepository.save(member);

    await this.auditService.logUpdate(
      AuditModule.MEMBER,
      id,
      oldValues,
      { ...updated },
      operator,
    );

    return updated;
  }

  async findByPhone(phone: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { phone, isDeleted: false },
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    return member;
  }
}
