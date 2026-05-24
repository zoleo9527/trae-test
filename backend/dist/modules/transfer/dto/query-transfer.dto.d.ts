import { TransferStatus } from '../../../common/enums/transfer-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QueryTransferDto extends PaginationDto {
    status?: TransferStatus;
    workOrderId?: string;
    fromConsultantId?: string;
    toConsultantId?: string;
}
