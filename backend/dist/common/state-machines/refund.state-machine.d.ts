import { RefundStatus } from '../enums/refund-status.enum';
export declare class RefundStateMachine {
    private static readonly transitions;
    static canTransition(from: RefundStatus, to: RefundStatus): boolean;
    static transition(from: RefundStatus, to: RefundStatus): void;
    static getAllowedTransitions(status: RefundStatus): RefundStatus[];
}
