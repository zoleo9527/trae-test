import { TransferStatus } from '../enums/transfer-status.enum';
import { BusinessError, ErrorCode } from '../errors/business-error';

export class TransferStateMachine {
  private static readonly transitions: Map<TransferStatus, TransferStatus[]> = new Map([
    [
      TransferStatus.INITIATED,
      [TransferStatus.HANDOVER_IN_PROGRESS, TransferStatus.REJECTED],
    ],
    [
      TransferStatus.HANDOVER_IN_PROGRESS,
      [TransferStatus.PENDING_RECEIPT, TransferStatus.REJECTED],
    ],
    [
      TransferStatus.PENDING_RECEIPT,
      [TransferStatus.RECEIVED, TransferStatus.REJECTED],
    ],
    [
      TransferStatus.RECEIVED,
      [TransferStatus.COMPLETED],
    ],
    [
      TransferStatus.REJECTED,
      [TransferStatus.INITIATED],
    ],
    [TransferStatus.COMPLETED, []],
  ]);

  static canTransition(from: TransferStatus, to: TransferStatus): boolean {
    const allowedTransitions = this.transitions.get(from) || [];
    return allowedTransitions.includes(to);
  }

  static transition(from: TransferStatus, to: TransferStatus): void {
    if (!this.canTransition(from, to)) {
      throw BusinessError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `无法将交接状态从 ${from} 转换为 ${to}`,
        { from, to },
      );
    }
  }

  static getAllowedTransitions(status: TransferStatus): TransferStatus[] {
    return this.transitions.get(status) || [];
  }
}
