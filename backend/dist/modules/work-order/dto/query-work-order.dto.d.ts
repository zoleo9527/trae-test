import { WorkOrderStatus } from '../../../common/enums/work-order-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QueryWorkOrderDto extends PaginationDto {
    status?: WorkOrderStatus;
    studentId?: string;
    currentConsultantId?: string;
}
