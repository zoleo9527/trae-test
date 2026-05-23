import { ReviewLevel } from '../../../entities/review-record.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateReviewDto {
    workOrderId: string;
    level?: ReviewLevel;
    rootCause?: string;
    repairProcess?: string;
    improvementMeasures?: string;
    lessonsLearned?: string;
    actualDowntimeMinutes?: number;
    actualPowerLoss?: number;
    actualPartCost?: number;
    actualLaborCost?: number;
    submittedById?: string;
}
export declare class UpdateReviewDto {
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
    verifiedById: string;
    remark?: string;
}
export declare class QueryReviewDto extends PaginationDto {
    workOrderId?: string;
    level?: ReviewLevel;
    isVerified?: boolean;
}
