import { RefundStatus } from '../../../common/enums/refund-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QueryRefundDto extends PaginationDto {
    status?: RefundStatus;
    workOrderId?: string;
    initiatorId?: string;
}
