import { ChangeOrderType } from '../../common/enums/change-order-status.enum';
export declare class CreateChangeOrderDto {
    title: string;
    description?: string;
    changeType: ChangeOrderType;
    projectId: string;
    projectName: string;
    constructionSite?: string;
    teamName?: string;
    reworkReason?: string;
    materialTracking?: string;
    originalAmount?: number;
    changedAmount?: number;
    laborCost?: number;
    materialCost?: number;
    equipmentCost?: number;
    otherCost?: number;
    estimatedDays?: number;
    proposedDate?: string;
}
