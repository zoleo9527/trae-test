export declare class CreateDailyReportDto {
    reportDate: string;
    projectId: string;
    projectName: string;
    constructionSite?: string;
    teamName?: string;
    workerCount?: number;
    workHours?: number;
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
}
