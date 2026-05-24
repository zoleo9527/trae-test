import { WorkOrderStatus } from '../enums/work-order-status.enum';
import { BusinessError, ErrorCode } from '../errors/business-error';

export class WorkOrderStateMachine {
  private static readonly transitions: Map<WorkOrderStatus, WorkOrderStatus[]> = new Map([
    [
      WorkOrderStatus.PENDING,
      [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
    ],
    [
      WorkOrderStatus.IN_PROGRESS,
      [
        WorkOrderStatus.WAITING_MATERIAL,
        WorkOrderStatus.WAITING_APPROVAL,
        WorkOrderStatus.TRANSFERRING,
        WorkOrderStatus.REFUND_NEGOTIATING,
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.CANCELLED,
      ],
    ],
    [
      WorkOrderStatus.WAITING_MATERIAL,
      [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
    ],
    [
      WorkOrderStatus.WAITING_APPROVAL,
      [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED, WorkOrderStatus.COMPLETED],
    ],
    [
      WorkOrderStatus.TRANSFERRING,
      [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
    ],
    [
      WorkOrderStatus.REFUND_NEGOTIATING,
      [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.REFUNDED, WorkOrderStatus.CANCELLED],
    ],
    [WorkOrderStatus.COMPLETED, []],
    [WorkOrderStatus.CANCELLED, []],
    [WorkOrderStatus.REFUNDED, []],
  ]);

  static canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
    const allowedTransitions = this.transitions.get(from) || [];
    return allowedTransitions.includes(to);
  }

  static transition(from: WorkOrderStatus, to: WorkOrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw BusinessError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `无法将工单状态从 ${from} 转换为 ${to}`,
        { from, to },
      );
    }
  }

  static getAllowedTransitions(status: WorkOrderStatus): WorkOrderStatus[] {
    return this.transitions.get(status) || [];
  }
}
