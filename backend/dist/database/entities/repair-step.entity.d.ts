import { BaseEntity } from './base.entity';
import { Repair } from './repair.entity';
export declare enum StepStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    SKIPPED = "skipped"
}
export declare class RepairStep extends BaseEntity {
    repairId: string;
    repair: Repair;
    stepOrder: number;
    stepName: string;
    stepDescription: string;
    status: StepStatus;
    operatorNote: string;
    startedAt: Date;
    completedAt: Date;
    operatorId: string;
}
