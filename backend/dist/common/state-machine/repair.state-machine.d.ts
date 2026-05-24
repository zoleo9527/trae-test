import { RepairStatus, UserRole } from '../../database/entities';
export interface RepairStateTransition {
    from: RepairStatus;
    to: RepairStatus;
    allowedRoles: UserRole[];
    action: string;
    description: string;
}
export declare class RepairStateMachine {
    private transitions;
    canTransition(currentStatus: RepairStatus, targetStatus: RepairStatus, userRole: UserRole): boolean;
    getAvailableTransitions(currentStatus: RepairStatus, userRole: UserRole): RepairStateTransition[];
    validateTransition(currentStatus: RepairStatus, targetStatus: RepairStatus, userRole: UserRole): void;
    isFinalStatus(status: RepairStatus): boolean;
}
