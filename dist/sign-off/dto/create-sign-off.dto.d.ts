import { SignOffType } from '../../common/enums/sign-off.enum';
export declare class CreateSignOffDto {
    signOffType: SignOffType;
    changeOrderId?: string;
    dailyReportId?: string;
    deliveryId?: string;
    comments?: string;
    deadline?: string;
    signerRole?: string;
    signerDepartment?: string;
}
