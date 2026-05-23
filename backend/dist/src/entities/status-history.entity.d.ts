import { WorkOrder } from './work-order.entity';
import { WorkOrderStatus } from '../common/enums/work-order.enum';
import { User } from './user.entity';
export declare class StatusHistory {
    id: string;
    workOrder: WorkOrder;
    workOrderId: string;
    fromStatus: WorkOrderStatus | null;
    toStatus: WorkOrderStatus;
    remark: string;
    operatedBy: User;
    operatedById: string;
    operatedAt: Date;
}
