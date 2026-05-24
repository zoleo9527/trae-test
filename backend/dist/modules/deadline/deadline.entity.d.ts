import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
export declare class Deadline {
    id: string;
    workOrderId: string;
    workOrder: WorkOrder;
    title: string;
    description: string;
    dueDate: Date;
    isCompleted: boolean;
    completedAt: Date;
    isOverdue: boolean;
    assigneeId: string;
    assignee: Consultant;
    reminderCount: number;
    lastReminderAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
