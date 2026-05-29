import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckinRecord } from '../../entities/checkin-record.entity';
import { Credential } from '../../entities/credential.entity';
import { Person } from '../../entities/person.entity';
import { Project } from '../../entities/project.entity';
import { CheckinType, CheckinStatus } from '../../common/enums/checkin.enum';
import { CredentialStatus } from '../../common/enums/credential.enum';
import {
  CreateCheckinRecordDto,
  CheckinQueryDto,
  ManualCheckinDto,
} from './dto/checkin.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/dto/response.dto';
import { QueryBuilderService } from '../../common/services/query-builder.service';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckinRecord)
    private checkinRepository: Repository<CheckinRecord>,
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private queryBuilderService: QueryBuilderService,
  ) {}

  async create(createDto: CreateCheckinRecordDto): Promise<CheckinRecord> {
    if (createDto.credentialId) {
      const credential = await this.credentialRepository.findOne({
        where: { id: createDto.credentialId },
      });

      if (!credential) {
        throw new NotFoundException(`Credential with ID ${createDto.credentialId} not found`);
      }

      if (credential.status !== CredentialStatus.ISSUED) {
        throw new BusinessException(
          'Credential is not issued yet',
          ErrorCode.CREDENTIAL_EXPIRED,
        );
      }

      if (credential.validTo && new Date(createDto.checkinTime) > credential.validTo) {
        throw new BusinessException(
          'Credential has expired',
          ErrorCode.CREDENTIAL_EXPIRED,
        );
      }
    }

    const status = await this.determineCheckinStatus(
      createDto.projectId,
      createDto.personId,
      createDto.type,
      new Date(createDto.checkinTime),
    );

    const checkin = this.checkinRepository.create({
      ...createDto,
      checkinTime: new Date(createDto.checkinTime),
      status,
    });

    return this.checkinRepository.save(checkin);
  }

  async manualCheckin(manualDto: ManualCheckinDto): Promise<CheckinRecord> {
    const person = await this.personRepository.findOne({
      where: { idCardNo: manualDto.idCardNo },
    });

    if (!person) {
      throw new NotFoundException(`Person with ID card number ${manualDto.idCardNo} not found`);
    }

    const credential = await this.credentialRepository.findOne({
      where: {
        projectId: manualDto.projectId,
        personId: person.id,
        status: CredentialStatus.ISSUED,
      },
    });

    if (!credential) {
      throw new BusinessException(
        'No valid credential found for this person in the project',
        ErrorCode.CREDENTIAL_EXPIRED,
      );
    }

    const checkinTime = new Date();
    const status = await this.determineCheckinStatus(
      manualDto.projectId,
      person.id,
      manualDto.type,
      checkinTime,
    );

    const checkin = this.checkinRepository.create({
      projectId: manualDto.projectId,
      personId: person.id,
      credentialId: credential.id,
      type: manualDto.type,
      checkinTime,
      checkinPoint: manualDto.checkinPoint,
      temperature: manualDto.temperature,
      remark: manualDto.remark,
      status,
    });

    return this.checkinRepository.save(checkin);
  }

  private async determineCheckinStatus(
    projectId: string,
    personId: string,
    type: CheckinType,
    checkinTime: Date,
  ): Promise<CheckinStatus> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      return CheckinStatus.NORMAL;
    }

    const checkinHour = checkinTime.getHours();
    const checkinMinute = checkinTime.getMinutes();
    const checkinMinutesOfDay = checkinHour * 60 + checkinMinute;

    const WORK_START_MINUTES = 8 * 60 + 30;
    const WORK_END_MINUTES = 18 * 60;
    const OVERTIME_THRESHOLD_MINUTES = 20 * 60;
    const LATE_GRACE_MINUTES = 15;
    const EARLY_LEAVE_GRACE_MINUTES = 15;

    const todayStart = new Date(checkinTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(checkinTime);
    todayEnd.setHours(23, 59, 59, 999);

    const todayRecords = await this.checkinRepository.find({
      where: {
        projectId,
        personId,
        checkinTime: Between(todayStart, todayEnd),
      },
      order: { checkinTime: 'ASC' },
    });

    const hasEntry = todayRecords.some((r) => r.type === CheckinType.ENTRY);
    const hasExit = todayRecords.some((r) => r.type === CheckinType.EXIT);

    if (type === CheckinType.ENTRY) {
      if (checkinMinutesOfDay > WORK_START_MINUTES + LATE_GRACE_MINUTES) {
        return CheckinStatus.LATE;
      }

      if (hasExit && !hasEntry) {
        return CheckinStatus.ABNORMAL;
      }

      return CheckinStatus.NORMAL;
    } else if (type === CheckinType.EXIT) {
      if (checkinMinutesOfDay < WORK_END_MINUTES - EARLY_LEAVE_GRACE_MINUTES) {
        return CheckinStatus.EARLY_LEAVE;
      }

      if (checkinMinutesOfDay >= OVERTIME_THRESHOLD_MINUTES) {
        return CheckinStatus.OVERTIME;
      }

      if (!hasEntry) {
        return CheckinStatus.ABNORMAL;
      }

      if (hasExit) {
        return CheckinStatus.ABNORMAL;
      }

      return CheckinStatus.NORMAL;
    }

    return CheckinStatus.NORMAL;
  }

  async findAll(
    pagination: PaginationQueryDto,
    filters: CheckinQueryDto,
  ): Promise<PaginatedResponse<CheckinRecord>> {
    const qb = this.checkinRepository.createQueryBuilder('checkin')
      .leftJoinAndSelect('checkin.project', 'project')
      .leftJoinAndSelect('checkin.person', 'person')
      .leftJoinAndSelect('checkin.credential', 'credential');

    this.queryBuilderService.applyKeywordSearch(qb, filters.keyword, [], 'checkin');

    if (filters.projectId) {
      qb.andWhere('checkin.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.personId) {
      qb.andWhere('checkin.personId = :personId', { personId: filters.personId });
    }

    if (filters.credentialId) {
      qb.andWhere('checkin.credentialId = :credentialId', { credentialId: filters.credentialId });
    }

    if (filters.type) {
      qb.andWhere('checkin.type = :type', { type: filters.type });
    }

    if (filters.status) {
      qb.andWhere('checkin.status = :status', { status: filters.status });
    }

    if (filters.startDate) {
      qb.andWhere('checkin.checkinTime >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters.endDate) {
      qb.andWhere('checkin.checkinTime <= :endDate', { endDate: new Date(filters.endDate) });
    }

    this.queryBuilderService.applySorting(qb, pagination, 'checkin');
    this.queryBuilderService.applyPagination(qb, pagination);

    const [items, total] = await qb.getManyAndCount();

    return new PaginatedResponse(items, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string): Promise<CheckinRecord> {
    const checkin = await this.checkinRepository.findOne({
      where: { id },
      relations: ['project', 'person', 'credential'],
    });

    if (!checkin) {
      throw new NotFoundException(`Checkin record with ID ${id} not found`);
    }

    return checkin;
  }

  async getCheckinStats(projectId?: string, date?: string): Promise<any> {
    const qb = this.checkinRepository
      .createQueryBuilder('checkin')
      .select([
        "checkin.type as type",
        "checkin.status as status",
        'COUNT(*) as count',
      ]);

    if (projectId) {
      qb.andWhere('checkin.projectId = :projectId', { projectId });
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      qb.andWhere('checkin.checkinTime BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const stats = await qb
      .groupBy('checkin.type, checkin.status')
      .getRawMany();

    return stats;
  }

  async getTodayCheckinList(projectId: string): Promise<any> {
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));

    const checkins = await this.checkinRepository
      .createQueryBuilder('checkin')
      .leftJoinAndSelect('checkin.person', 'person')
      .leftJoinAndSelect('checkin.credential', 'credential')
      .where('checkin.projectId = :projectId', { projectId })
      .andWhere('checkin.checkinTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('checkin.checkinTime', 'DESC')
      .getMany();

    return checkins;
  }

  async remove(id: string): Promise<void> {
    const checkin = await this.findOne(id);
    await this.checkinRepository.delete(id);
  }
}
