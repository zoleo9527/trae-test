import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusLog } from '../entities/status-log.entity';
import { BusinessException, ErrorCode } from '../filters/http-exception.filter';

export interface StatusTransitionConfig {
  [status: string]: string[];
}

@Injectable()
export class StateMachineService {
  constructor(
    @InjectRepository(StatusLog)
    private statusLogRepository: Repository<StatusLog>,
  ) {}

  validateTransition(
    currentStatus: string,
    targetStatus: string,
    transitions: StatusTransitionConfig,
  ): boolean {
    const allowedTransitions = transitions[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
  }

  ensureValidTransition(
    currentStatus: string,
    targetStatus: string,
    transitions: StatusTransitionConfig,
    entityName: string,
  ): void {
    if (currentStatus === targetStatus) {
      return;
    }

    if (!this.validateTransition(currentStatus, targetStatus, transitions)) {
      throw new BusinessException(
        `Invalid ${entityName} status transition: ${currentStatus} -> ${targetStatus}. Allowed transitions: ${transitions[currentStatus]?.join(', ') || 'none'}`,
        ErrorCode.INVALID_STATUS_TRANSITION,
      );
    }
  }

  async logStatusChange(
    entityType: string,
    entityId: string,
    fromStatus: string,
    toStatus: string,
    operator?: string,
    remark?: string,
    projectId?: string,
    metadata?: Record<string, any>,
  ): Promise<StatusLog> {
    const log = this.statusLogRepository.create({
      entityType,
      entityId,
      fromStatus,
      toStatus,
      operator,
      remark,
      projectId,
      metadata,
    });

    return this.statusLogRepository.save(log);
  }

  async getStatusHistory(entityType: string, entityId: string): Promise<StatusLog[]> {
    return this.statusLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
