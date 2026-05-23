import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';
export declare enum ReviewLevel {
    MINOR = "minor",
    MEDIUM = "medium",
    MAJOR = "major",
    CRITICAL = "critical"
}
export declare class ReviewRecord {
    id: string;
    workOrder: WorkOrder;
    workOrderId: string;
    level: ReviewLevel;
    rootCause: string;
    repairProcess: string;
    improvementMeasures: string;
    lessonsLearned: string;
    actualDowntimeMinutes: number;
    actualPowerLoss: number;
    actualPartCost: number;
    actualLaborCost: number;
    totalCost: number;
    submittedBy: User;
    submittedById: string;
    submittedAt: Date;
    isVerified: boolean;
    verifiedBy: User;
    verifiedById: string;
    verifiedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
