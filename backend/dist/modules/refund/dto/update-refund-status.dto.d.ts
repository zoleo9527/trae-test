import { RefundStatus } from '../../../common/enums/refund-status.enum';
export declare class UpdateRefundStatusDto {
    status: RefundStatus;
    operatorId: string;
    operatorName: string;
    rejectionReason?: string;
    approvedAmount?: number;
    reviewerId?: string;
}
