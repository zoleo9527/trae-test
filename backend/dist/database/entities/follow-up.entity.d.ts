import { BaseEntity } from './base.entity';
import { Member } from './member.entity';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';
export declare enum FollowUpType {
    AFTER_SALES = "after_sales",
    REPAIR_COMPLETED = "repair_completed",
    BIRTHDAY = "birthday",
    MEMBER_CARE = "member_care",
    COMPLAINT = "complaint",
    OTHER = "other"
}
export declare enum FollowUpChannel {
    PHONE = "phone",
    WECHAT = "wechat",
    SMS = "sms",
    EMAIL = "email",
    IN_PERSON = "in_person"
}
export declare enum FollowUpResult {
    SATISFIED = "satisfied",
    PARTIALLY_SATISFIED = "partially_satisfied",
    DISSATISFIED = "dissatisfied",
    NO_ANSWER = "no_answer",
    CALL_BACK_LATER = "call_back_later"
}
export declare enum FollowUpStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class FollowUp extends BaseEntity {
    followUpNo: string;
    memberId: string;
    member: Member;
    workOrderId: string;
    workOrder: WorkOrder;
    type: FollowUpType;
    channel: FollowUpChannel;
    status: FollowUpStatus;
    result: FollowUpResult;
    assignedTo: string;
    assignee: User;
    followUpContent: string;
    customerFeedback: string;
    internalNote: string;
    plannedAt: Date;
    actualAt: Date;
    followUpCount: number;
    nextFollowUpAt: Date;
    needsEscalation: boolean;
    escalationReason: string;
}
