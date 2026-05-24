import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
import { Comment } from '../comment/comment.entity';
export declare class Transfer {
    id: string;
    workOrderId: string;
    workOrder: WorkOrder;
    fromConsultantId: string;
    fromConsultant: Consultant;
    toConsultantId: string;
    toConsultant: Consultant;
    handoverContent: string;
    keyNotes: string;
    pendingItems: string;
    status: TransferStatus;
    rejectionReason: string;
    receivedAt: Date;
    completedAt: Date;
    initiatorId: string;
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
