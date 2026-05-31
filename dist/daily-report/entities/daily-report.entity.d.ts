import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';
export declare class DailyReport extends BaseEntity {
    reportDate: string;
    projectId: string;
    projectName: string;
    constructionSite?: string;
    teamName?: string;
    workerCount: number;
    workHours: number;
    workContent: string;
    progressStatus?: string;
    qualityIssues?: string;
    safetyIssues?: string;
    materialsUsed?: string;
    equipmentUsed?: string;
    nextDayPlan?: string;
    problemsEncountered?: string;
    weatherCondition?: string;
    changeOrderId?: string;
    changeOrder?: ChangeOrder;
    createdById: string;
    createdBy: User;
    signOffs: SignOff[];
    attachments?: Array<{
        name: string;
        url: string;
        type: string;
    }>;
    metadata?: Record<string, any>;
}
