import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditModule, User } from '../../database/entities';

export interface AuditLogData {
  module: AuditModule;
  recordId: string;
  action: AuditAction;
  actionDescription: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(
    logData: AuditLogData,
    operator?: User,
  ): Promise<AuditLog> {
    const log = new AuditLog();
    log.module = logData.module;
    log.recordId = logData.recordId;
    log.action = logData.action;
    log.actionDescription = logData.actionDescription;
    log.oldValues = logData.oldValues;
    log.newValues = logData.newValues;
    log.ipAddress = logData.ipAddress;
    log.userAgent = logData.userAgent;

    if (operator) {
      log.operatorId = operator.id;
      log.operatorName = operator.realName;
      log.createdBy = operator.id;
    }

    return this.auditLogRepository.save(log);
  }

  async logCreate(
    module: AuditModule,
    recordId: string,
    newValues: Record<string, any>,
    operator?: User,
    ipAddress?: string,
  ): Promise<AuditLog> {
    return this.createLog(
      {
        module,
        recordId,
        action: AuditAction.CREATE,
        actionDescription: `创建${module}记录`,
        newValues,
        ipAddress,
      },
      operator,
    );
  }

  async logUpdate(
    module: AuditModule,
    recordId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    operator?: User,
    ipAddress?: string,
  ): Promise<AuditLog> {
    const changes = this.getChangedFields(oldValues, newValues);
    return this.createLog(
      {
        module,
        recordId,
        action: AuditAction.UPDATE,
        actionDescription: `更新${module}记录，修改字段: ${Object.keys(changes).join(', ')}`,
        oldValues: changes.old,
        newValues: changes.new,
        ipAddress,
      },
      operator,
    );
  }

  async logDelete(
    module: AuditModule,
    recordId: string,
    oldValues: Record<string, any>,
    operator?: User,
    ipAddress?: string,
  ): Promise<AuditLog> {
    return this.createLog(
      {
        module,
        recordId,
        action: AuditAction.DELETE,
        actionDescription: `删除${module}记录`,
        oldValues,
        ipAddress,
      },
      operator,
    );
  }

  async logStatusChange(
    module: AuditModule,
    recordId: string,
    fromStatus: string,
    toStatus: string,
    reason?: string,
    operator?: User,
    ipAddress?: string,
  ): Promise<AuditLog> {
    return this.createLog(
      {
        module,
        recordId,
        action: AuditAction.STATUS_CHANGE,
        actionDescription: `状态变更: ${fromStatus} -> ${toStatus}${reason ? `, 原因: ${reason}` : ''}`,
        oldValues: { status: fromStatus },
        newValues: { status: toStatus, reason },
        ipAddress,
      },
      operator,
    );
  }

  async logHandover(
    module: AuditModule,
    recordId: string,
    handoverType: string,
    description: string,
    operator?: User,
    ipAddress?: string,
  ): Promise<AuditLog> {
    return this.createLog(
      {
        module,
        recordId,
        action: AuditAction.HANDOVER,
        actionDescription: `货品交接[${handoverType}]: ${description}`,
        newValues: { handoverType, description },
        ipAddress,
      },
      operator,
    );
  }

  async logApproval(
    module: AuditModule,
    recordId: string,
    approved: boolean,
    reason?: string,
    operator?: User,
    ipAddress?: string,
  ): Promise<AuditLog> {
    return this.createLog(
      {
        module,
        recordId,
        action: approved ? AuditAction.APPROVE : AuditAction.REJECT,
        actionDescription: `${approved ? '审批通过' : '审批拒绝'}${reason ? `: ${reason}` : ''}`,
        newValues: { approved, reason },
        ipAddress,
      },
      operator,
    );
  }

  async getLogsByRecord(
    module: AuditModule,
    recordId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { module, recordId, isDeleted: false },
      order: { createdAt: 'DESC' },
      relations: ['operator'],
    });
  }

  async getLogsByOperator(operatorId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { operatorId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  private getChangedFields(
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): { old: Record<string, any>; new: Record<string, any> } {
    const oldChanged: Record<string, any> = {};
    const newChanged: Record<string, any> = {};

    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        oldChanged[key] = oldValues[key];
        newChanged[key] = newValues[key];
      }
    }

    return { old: oldChanged, new: newChanged };
  }
}
