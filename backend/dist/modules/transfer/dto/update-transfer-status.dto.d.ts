import { TransferStatus } from '../../../common/enums/transfer-status.enum';
export declare class UpdateTransferStatusDto {
    status: TransferStatus;
    operatorId: string;
    operatorName: string;
    rejectionReason?: string;
}
