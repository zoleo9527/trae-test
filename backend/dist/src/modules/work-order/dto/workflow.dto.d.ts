import { PartRequestStatus } from '../../../entities/part-usage.entity';
import { ReviewLevel } from '../../../entities/review-record.entity';
export declare class ConfirmDowntimeDto {
    operatorId: string;
    startTime: Date;
    endTime?: Date;
    reason?: string;
    remark?: string;
}
export declare class RequestPartDto {
    operatorId: string;
    sparePartId: string;
    quantity: number;
    requestReason?: string;
}
export declare class ApprovePartDto {
    operatorId: string;
    partUsageId: string;
    status: PartRequestStatus.APPROVED | PartRequestStatus.REJECTED;
    approvalRemark?: string;
}
export declare class ReceivePartDto {
    operatorId: string;
    partUsageId: string;
}
export declare class CompleteRepairDto {
    operatorId: string;
    remark?: string;
}
export declare class SubmitReviewDto {
    operatorId: string;
    level?: ReviewLevel;
    rootCause?: string;
    repairProcess?: string;
    improvementMeasures?: string;
    lessonsLearned?: string;
    actualDowntimeMinutes?: number;
    actualPowerLoss?: number;
    actualPartCost?: number;
    actualLaborCost?: number;
}
export declare class VerifyReviewDto {
    operatorId: string;
    remark?: string;
}
