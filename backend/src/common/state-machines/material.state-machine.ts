import { MaterialStatus } from '../enums/material-status.enum';
import { BusinessError, ErrorCode } from '../errors/business-error';

export class MaterialStateMachine {
  private static readonly transitions: Map<MaterialStatus, MaterialStatus[]> = new Map([
    [
      MaterialStatus.DRAFT,
      [MaterialStatus.SUBMITTED],
    ],
    [
      MaterialStatus.SUBMITTED,
      [MaterialStatus.UNDER_REVIEW, MaterialStatus.NEEDS_REVISION],
    ],
    [
      MaterialStatus.UNDER_REVIEW,
      [MaterialStatus.APPROVED, MaterialStatus.NEEDS_REVISION],
    ],
    [
      MaterialStatus.NEEDS_REVISION,
      [MaterialStatus.SUBMITTED],
    ],
    [MaterialStatus.APPROVED, [MaterialStatus.EXPIRED]],
    [MaterialStatus.EXPIRED, []],
  ]);

  static canTransition(from: MaterialStatus, to: MaterialStatus): boolean {
    const allowedTransitions = this.transitions.get(from) || [];
    return allowedTransitions.includes(to);
  }

  static transition(from: MaterialStatus, to: MaterialStatus): void {
    if (!this.canTransition(from, to)) {
      throw BusinessError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `无法将材料状态从 ${from} 转换为 ${to}`,
        { from, to },
      );
    }
  }

  static getAllowedTransitions(status: MaterialStatus): MaterialStatus[] {
    return this.transitions.get(status) || [];
  }
}
