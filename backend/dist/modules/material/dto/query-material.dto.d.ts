import { MaterialStatus, MaterialType } from '../../../common/enums/material-status.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QueryMaterialDto extends PaginationDto {
    status?: MaterialStatus;
    workOrderId?: string;
    ownerId?: string;
    type?: MaterialType;
}
