import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PartRequestStatus } from '../../../entities/part-usage.entity';
export declare class CreateSparePartDto {
    partCode: string;
    name: string;
    specification?: string;
    manufacturer?: string;
    unitPrice?: number;
    stockQuantity?: number;
    unit?: string;
    location?: string;
    description?: string;
}
export declare class UpdateSparePartDto {
    name?: string;
    specification?: string;
    manufacturer?: string;
    unitPrice?: number;
    stockQuantity?: number;
    unit?: string;
    location?: string;
    description?: string;
}
export declare class QuerySparePartDto extends PaginationDto {
    keyword?: string;
    partCode?: string;
    manufacturer?: string;
}
export declare class CreatePartUsageDto {
    workOrderId: string;
    sparePartId: string;
    quantity: number;
    requestReason?: string;
    requestedById?: string;
}
export declare class ApprovePartUsageDto {
    approvedById: string;
    approvalRemark?: string;
    status: PartRequestStatus.APPROVED | PartRequestStatus.REJECTED;
}
export declare class ReceivePartUsageDto {
    receivedById: string;
}
export declare class QueryPartUsageDto extends PaginationDto {
    workOrderId?: string;
    status?: PartRequestStatus;
    sparePartId?: string;
}
