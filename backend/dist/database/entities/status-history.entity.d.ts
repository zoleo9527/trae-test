import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';
export declare class StatusHistory extends BaseEntity {
    workOrderId: string;
    workOrder: WorkOrder;
    fromStatus: string;
    toStatus: string;
    operatorId: string;
    operator: User;
    changeReason: string;
    remark: string;
    snapshotData: Record<string, any>;
}
