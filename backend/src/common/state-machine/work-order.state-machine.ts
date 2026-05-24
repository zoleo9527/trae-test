import { Injectable, BadRequestException } from '@nestjs/common';
import { WorkOrderStatus, UserRole } from '../../database/entities';

export interface StateTransition {
  from: WorkOrderStatus;
  to: WorkOrderStatus;
  allowedRoles: UserRole[];
  action: string;
  description: string;
}

@Injectable()
export class WorkOrderStateMachine {
  private transitions: StateTransition[] = [
    {
      from: WorkOrderStatus.DRAFT,
      to: WorkOrderStatus.PENDING_REVIEW,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN],
      action: 'submit',
      description: '提交审核',
    },
    {
      from: WorkOrderStatus.DRAFT,
      to: WorkOrderStatus.CANCELLED,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN],
      action: 'cancel',
      description: '取消工单',
    },
    {
      from: WorkOrderStatus.PENDING_REVIEW,
      to: WorkOrderStatus.REVIEWED,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'approve',
      description: '审核通过',
    },
    {
      from: WorkOrderStatus.PENDING_REVIEW,
      to: WorkOrderStatus.REJECTED,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'reject',
      description: '审核驳回',
    },
    {
      from: WorkOrderStatus.REJECTED,
      to: WorkOrderStatus.DRAFT,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN],
      action: 'revise',
      description: '修改后重新提交',
    },
    {
      from: WorkOrderStatus.REJECTED,
      to: WorkOrderStatus.CANCELLED,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'cancel',
      description: '取消工单',
    },
    {
      from: WorkOrderStatus.REVIEWED,
      to: WorkOrderStatus.IN_PROGRESS,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'start',
      description: '开始处理',
    },
    {
      from: WorkOrderStatus.REVIEWED,
      to: WorkOrderStatus.NEEDS_REVIEW,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'request_review',
      description: '需要复核',
    },
    {
      from: WorkOrderStatus.IN_PROGRESS,
      to: WorkOrderStatus.PENDING_CONFIRM,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'complete_process',
      description: '处理完成待确认',
    },
    {
      from: WorkOrderStatus.IN_PROGRESS,
      to: WorkOrderStatus.NEEDS_REVIEW,
      allowedRoles: [UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN],
      action: 'request_review',
      description: '需要复核',
    },
    {
      from: WorkOrderStatus.NEEDS_REVIEW,
      to: WorkOrderStatus.IN_PROGRESS,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'resume',
      description: '复核通过继续处理',
    },
    {
      from: WorkOrderStatus.NEEDS_REVIEW,
      to: WorkOrderStatus.REJECTED,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'reject',
      description: '复核不通过',
    },
    {
      from: WorkOrderStatus.PENDING_CONFIRM,
      to: WorkOrderStatus.COMPLETED,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN, UserRole.CUSTOMER_SERVICE],
      action: 'confirm',
      description: '确认完成',
    },
    {
      from: WorkOrderStatus.PENDING_CONFIRM,
      to: WorkOrderStatus.IN_PROGRESS,
      allowedRoles: [UserRole.MANAGER, UserRole.ADMIN],
      action: 'rework',
      description: '返工',
    },
    {
      from: WorkOrderStatus.PENDING_CONFIRM,
      to: WorkOrderStatus.NEEDS_REVIEW,
      allowedRoles: [UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN],
      action: 'request_review',
      description: '需要复核',
    },
  ];

  canTransition(
    currentStatus: WorkOrderStatus,
    targetStatus: WorkOrderStatus,
    userRole: UserRole,
  ): boolean {
    const transition = this.transitions.find(
      (t) => t.from === currentStatus && t.to === targetStatus,
    );
    if (!transition) return false;
    return transition.allowedRoles.includes(userRole);
  }

  getAvailableTransitions(
    currentStatus: WorkOrderStatus,
    userRole: UserRole,
  ): StateTransition[] {
    return this.transitions.filter(
      (t) => t.from === currentStatus && t.allowedRoles.includes(userRole),
    );
  }

  getTransition(
    currentStatus: WorkOrderStatus,
    targetStatus: WorkOrderStatus,
  ): StateTransition | undefined {
    return this.transitions.find(
      (t) => t.from === currentStatus && t.to === targetStatus,
    );
  }

  validateTransition(
    currentStatus: WorkOrderStatus,
    targetStatus: WorkOrderStatus,
    userRole: UserRole,
  ): void {
    const transition = this.getTransition(currentStatus, targetStatus);
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

  isFinalStatus(status: WorkOrderStatus): boolean {
    return [
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.CANCELLED,
    ].includes(status);
  }
}
