import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';
export declare class DowntimeRecord {
    id: string;
    workOrder: WorkOrder;
    workOrderId: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    reason: string;
    isConfirmed: boolean;
    confirmedBy: User;
    confirmedById: string;
    confirmedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
