import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(
    entityType: string,
    entityId: number,
    action: string,
    description: string,
    operatorName: string,
    operatorRole: string,
    oldValue?: any,
    newValue?: any,
  ) {
    const log = this.activityLogRepository.create({
      entityType,
      entityId,
      action,
      description,
      operatorName,
      operatorRole,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    });
    return this.activityLogRepository.save(log);
  }

  async findByEntity(entityType: string, entityId: number) {
    return this.activityLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
