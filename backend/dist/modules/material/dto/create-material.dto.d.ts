import { MaterialType } from '../../../common/enums/material-status.enum';
export declare class CreateMaterialDto {
    workOrderId: string;
    name: string;
    type: MaterialType;
    fileUrl?: string;
    description?: string;
    deadline?: string;
    ownerId: string;
    operatorId: string;
    operatorName: string;
}
