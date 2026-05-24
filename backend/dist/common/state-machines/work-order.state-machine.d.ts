import { WorkOrderStatus } from '../enums/work-order-status.enum';
export declare class WorkOrderStateMachine {
    private static readonly transitions;
    static canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean;
    static transition(from: WorkOrderStatus, to: WorkOrderStatus): void;
    static getAllowedTransitions(status: WorkOrderStatus): WorkOrderStatus[];
}
