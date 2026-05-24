import { RefundStatus } from '../../common/enums/refund-status.enum';
import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
import { Comment } from '../comment/comment.entity';
export declare class Refund {
    id: string;
    workOrderId: string;
    workOrder: WorkOrder;
    requestedAmount: number;
    approvedAmount: number;
    reason: string;
    negotiationHistory: string;
    status: RefundStatus;
    rejectionReason: string;
    initiatorId: string;
    initiator: Consultant;
    reviewerId: string;
    reviewer: Consultant;
    reviewedAt: Date;
    completedAt: Date;
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
