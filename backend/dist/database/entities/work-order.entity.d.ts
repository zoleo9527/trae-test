import { BaseEntity } from './base.entity';
import { Member } from './member.entity';
import { User } from './user.entity';
import { WorkOrderItem } from './work-order-item.entity';
import { Repair } from './repair.entity';
import { FollowUp } from './follow-up.entity';
import { StatusHistory } from './status-history.entity';
export declare enum WorkOrderType {
    REPAIR = "repair",
    CUSTOM = "custom",
    TRANSFER = "transfer",
    RETURN = "return",
    EXCHANGE = "exchange",
    CLEANING = "cleaning"
}
export declare enum WorkOrderPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum WorkOrderStatus {
    DRAFT = "draft",
    PENDING_REVIEW = "pending_review",
    REVIEWED = "reviewed",
    IN_PROGRESS = "in_progress",
    PENDING_CONFIRM = "pending_confirm",
    COMPLETED = "completed",
    REJECTED = "rejected",
    CANCELLED = "cancelled",
    NEEDS_REVIEW = "needs_review"
}
export declare class WorkOrder extends BaseEntity {
    orderNo: string;
    type: WorkOrderType;
    priority: WorkOrderPriority;
    status: WorkOrderStatus;
    memberId: string;
    member: Member;
    handlerId: string;
    handler: User;
    problemDescription: string;
    customerRequirement: string;
    internalNote: string;
    estimatedCost: number;
    actualCost: number;
    expectedCompletionAt: Date;
    completedAt: Date;
    needsFollowUp: boolean;
    isPaymentConfirmed: boolean;
    items: WorkOrderItem[];
    repairs: Repair[];
    followUps: FollowUp[];
    statusHistories: StatusHistory[];
}
