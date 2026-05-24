import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
export declare class UpdateWorkOrderStatusDto {
    status: WorkOrderStatus;
    operatorId: string;
    operatorName: string;
    remark?: string;
}
