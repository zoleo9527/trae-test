import { WorkOrder } from './work-order.entity';
import { SparePart } from './spare-part.entity';
import { User } from './user.entity';
export declare enum PartRequestStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    RECEIVED = "received"
}
export declare class PartUsage {
    id: string;
    workOrder: WorkOrder;
    workOrderId: string;
    sparePart: SparePart;
    sparePartId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: PartRequestStatus;
    requestReason: string;
    requestedBy: User;
    requestedById: string;
    approvedBy: User;
    approvedById: string;
    approvedAt: Date;
    approvalRemark: string;
    receivedBy: User;
    receivedById: string;
    receivedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
