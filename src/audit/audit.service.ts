import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditEntityType } from './entities/audit-log.entity';
import { User } from '../user/entities/user.entity';

export interface CreateAuditLogDto {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  user?: User;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      entityName: dto.entityName,
      userId: dto.user?.id,
      userName: dto.user?.fullName,
      userRole: dto.user?.role,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      oldValues: dto.oldValues,
      newValues: dto.newValues,
      changedFields: this.getChangedFields(dto.oldValues, dto.newValues),
      description: dto.description,
      metadata: dto.metadata,
    });

    return this.auditLogRepository.save(log);
  }

  private getChangedFields(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): string[] | undefined {
    if (!oldValues || !newValues) {
      return undefined;
    }

    const changedFields: string[] = [];
    const allFields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const field of allFields) {
      if (JSON.stringify(oldValues[field]) !== JSON.stringify(newValues[field])) {
        changedFields.push(field);
      }
    }

    return changedFields.length > 0 ? changedFields : undefined;
  }

  async findByEntity(entityType: AuditEntityType, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      entityType?: AuditEntityType;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    if (filters?.entityType) {
      queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters?.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const [data, total] = await queryBuilder
      .orderBy('audit_log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .leftJoinAndSelect('audit_log.user', 'user')
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getEntityHistory(entityType: AuditEntityType, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'ASC' },
    });
  }
}
