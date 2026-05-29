import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusLog } from '../../entities/status-log.entity';
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
    const logData: any = {
      entityType,
      entityId,
      fromStatus,
      toStatus,
      operator,
      remark,
      projectId,
      metadata,
    };

    switch (entityType) {
      case 'credential':
        logData.credentialId = entityId;
        break;
      case 'material':
        logData.materialId = entityId;
        break;
      case 'settlement':
        logData.settlementId = entityId;
        break;
    }

    const log = this.statusLogRepository.create(logData as any) as unknown as StatusLog;
    return this.statusLogRepository.save(log);
  }

  async getStatusHistory(entityType: string, entityId: string): Promise<StatusLog[]> {
    const whereCondition: any = { entityType, entityId };
    
    switch (entityType) {
      case 'credential':
        whereCondition.credentialId = entityId;
        break;
      case 'material':
        whereCondition.materialId = entityId;
        break;
      case 'settlement':
        whereCondition.settlementId = entityId;
        break;
    }
    
    return this.statusLogRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }
}
