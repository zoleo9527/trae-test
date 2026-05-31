import { ChangeOrderStatus } from '../../common/enums/change-order-status.enum';
export declare class StatusTransitionDto {
    targetStatus: ChangeOrderStatus;
    reason?: string;
    comments?: string;
}
