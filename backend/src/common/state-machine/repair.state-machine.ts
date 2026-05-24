import { Injectable, BadRequestException } from '@nestjs/common';
import { RepairStatus, UserRole } from '../../database/entities';

export interface RepairStateTransition {
  from: RepairStatus;
  to: RepairStatus;
  allowedRoles: UserRole[];
  action: string;
  description: string;
}

@Injectable()
export class RepairStateMachine {
  private transitions: RepairStateTransition[] = [
    {
      from: RepairStatus.PENDING,
      to: RepairStatus.IN_PROGRESS,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'start',
      description: '开始维修',
    },
    {
      from: RepairStatus.PENDING,
      to: RepairStatus.NEEDS_QUOTATION,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'request_quotation',
      description: '需要报价',
    },
    {
      from: RepairStatus.PENDING,
      to: RepairStatus.CANCELLED,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'cancel',
      description: '取消维修',
    },
    {
      from: RepairStatus.IN_PROGRESS,
      to: RepairStatus.NEEDS_QUOTATION,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'request_quotation',
      description: '需要追加报价',
    },
    {
      from: RepairStatus.IN_PROGRESS,
      to: RepairStatus.COMPLETED,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'complete',
      description: '维修完成',
    },
    {
      from: RepairStatus.NEEDS_QUOTATION,
      to: RepairStatus.QUOTATION_APPROVED,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN],
      action: 'approve_quotation',
      description: '报价已确认',
    },
    {
      from: RepairStatus.NEEDS_QUOTATION,
      to: RepairStatus.QUOTATION_REJECTED,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN],
      action: 'reject_quotation',
      description: '报价未通过',
    },
    {
      from: RepairStatus.QUOTATION_APPROVED,
      to: RepairStatus.IN_PROGRESS,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'resume',
      description: '继续维修',
    },
    {
      from: RepairStatus.QUOTATION_REJECTED,
      to: RepairStatus.CANCELLED,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'cancel',
      description: '取消维修',
    },
    {
      from: RepairStatus.QUOTATION_REJECTED,
      to: RepairStatus.NEEDS_QUOTATION,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 're_quote',
      description: '重新报价',
    },
  ];

  canTransition(
    currentStatus: RepairStatus,
    targetStatus: RepairStatus,
    userRole: UserRole,
  ): boolean {
    const transition = this.transitions.find(
      (t) => t.from === currentStatus && t.to === targetStatus,
    );
    if (!transition) return false;
    return transition.allowedRoles.includes(userRole);
  }

  getAvailableTransitions(
    currentStatus: RepairStatus,
    userRole: UserRole,
  ): RepairStateTransition[] {
    return this.transitions.filter(
      (t) => t.from === currentStatus && t.allowedRoles.includes(userRole),
    );
  }

  validateTransition(
    currentStatus: RepairStatus,
    targetStatus: RepairStatus,
    userRole: UserRole,
  ): void {
    const transition = this.transitions.find(
      (t) => t.from === currentStatus && t.to === targetStatus,
    );
    if (!transition) {
      throw new BadRequestException(
        `不允许从 ${currentStatus} 状态变更为 ${targetStatus}`,
      );
    }
    if (!transition.allowedRoles.includes(userRole)) {
      throw new BadRequestException(
        `当前角色 ${userRole} 没有权限执行此状态变更`,
      );
    }
  }

  isFinalStatus(status: RepairStatus): boolean {
    return [
      RepairStatus.COMPLETED,
      RepairStatus.CANCELLED,
      RepairStatus.QUOTATION_REJECTED,
    ].includes(status);
  }
}
