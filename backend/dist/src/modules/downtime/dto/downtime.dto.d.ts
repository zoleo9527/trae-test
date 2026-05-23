import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class CreateDowntimeDto {
    workOrderId: string;
    startTime: Date;
    endTime?: Date;
    reason?: string;
}
export declare class UpdateDowntimeDto {
    startTime?: Date;
    endTime?: Date;
    reason?: string;
}
export declare class ConfirmDowntimeDto {
    confirmedById: string;
    remark?: string;
}
export declare class QueryDowntimeDto extends PaginationDto {
    workOrderId?: string;
    isConfirmed?: boolean;
    startDate?: Date;
    endDate?: Date;
}
