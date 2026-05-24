import { WorkOrderStatus, UserRole } from '../../database/entities';
export interface StateTransition {
    from: WorkOrderStatus;
    to: WorkOrderStatus;
    allowedRoles: UserRole[];
    action: string;
    description: string;
}
export declare class WorkOrderStateMachine {
    private transitions;
    canTransition(currentStatus: WorkOrderStatus, targetStatus: WorkOrderStatus, userRole: UserRole): boolean;
    getAvailableTransitions(currentStatus: WorkOrderStatus, userRole: UserRole): StateTransition[];
    getTransition(currentStatus: WorkOrderStatus, targetStatus: WorkOrderStatus): StateTransition | undefined;
    validateTransition(currentStatus: WorkOrderStatus, targetStatus: WorkOrderStatus, userRole: UserRole): void;
    isFinalStatus(status: WorkOrderStatus): boolean;
}
