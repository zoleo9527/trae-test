import { WorkOrderStatus, AbnormalType } from '../../../common/enums/work-order.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateWorkOrderDto {
    title: string;
    abnormalType: AbnormalType;
    station: string;
    description?: string;
    equipmentNo?: string;
    reporterId?: string;
}
export declare class UpdateWorkOrderDto {
    title?: string;
    description?: string;
    remark?: string;
    powerLoss?: number;
}
export declare class QueryWorkOrderDto extends PaginationDto {
    status?: WorkOrderStatus;
    abnormalType?: AbnormalType;
    station?: string;
    keyword?: string;
    reporterId?: string;
    handlerId?: string;
    startDate?: Date;
    endDate?: Date;
}
export declare class TransitionStatusDto {
    targetStatus: WorkOrderStatus;
    remark?: string;
    operatorId?: string;
}
export declare class AssignHandlerDto {
    handlerId: string;
}
