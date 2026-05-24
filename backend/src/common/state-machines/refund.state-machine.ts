import { RefundStatus } from '../enums/refund-status.enum';
import { BusinessError, ErrorCode } from '../errors/business-error';

export class RefundStateMachine {
  private static readonly transitions: Map<RefundStatus, RefundStatus[]> = new Map([
    [
      RefundStatus.DRAFT,
      [RefundStatus.SUBMITTED],
    ],
    [
      RefundStatus.SUBMITTED,
      [RefundStatus.UNDER_REVIEW, RefundStatus.REJECTED],
    ],
    [
      RefundStatus.UNDER_REVIEW,
      [RefundStatus.APPROVED, RefundStatus.REJECTED, RefundStatus.SUBMITTED],
    ],
    [
      RefundStatus.APPROVED,
      [RefundStatus.PROCESSING],
    ],
    [
      RefundStatus.PROCESSING,
      [RefundStatus.COMPLETED],
    ],
    [
      RefundStatus.REJECTED,
      [RefundStatus.SUBMITTED],
    ],
    [RefundStatus.COMPLETED, []],
  ]);

  static canTransition(from: RefundStatus, to: RefundStatus): boolean {
    const allowedTransitions = this.transitions.get(from) || [];
    return allowedTransitions.includes(to);
  }

  static transition(from: RefundStatus, to: RefundStatus): void {
    if (!this.canTransition(from, to)) {
      throw BusinessError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `无法将退款状态从 ${from} 转换为 ${to}`,
        { from, to },
      );
    }
  }

  static getAllowedTransitions(status: RefundStatus): RefundStatus[] {
    return this.transitions.get(status) || [];
  }
}
