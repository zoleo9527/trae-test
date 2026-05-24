import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    entityType: string,
    entityId: string,
    action: string,
    oldValue: Record<string, any> | null,
    newValue: Record<string, any> | null,
    operatorId?: string,
    operatorName?: string,
    remark?: string,
  ): Promise<AuditLog> {
    const changedFields = this.getChangedFields(oldValue, newValue);

    const log = this.auditLogRepository.create({
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      changedFields,
      operatorId,
      operatorName,
      remark,
    });

    return this.auditLogRepository.save(log);
  }

  private getChangedFields(
    oldValue: Record<string, any> | null,
    newValue: Record<string, any> | null,
  ): string[] {
    if (!oldValue || !newValue) return [];

    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
      if (oldValue[key] !== newValue[key]) {
        changed.push(key);
      }
    }

    return changed;
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByOperator(operatorId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { operatorId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
