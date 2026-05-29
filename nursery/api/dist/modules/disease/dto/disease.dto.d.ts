import { DiseaseSeverity, DiseaseStatus } from '../disease.entity';
export declare class CreateDiseaseDto {
    inspectionId: number;
    plotId: number;
    reporterId: number;
    type: string;
    severity: DiseaseSeverity;
    description?: string;
    affectedQuantity?: number;
    reportedAt: string;
    status?: DiseaseStatus;
}
export declare class UpdateDiseaseStatusDto {
    status: DiseaseStatus;
    operatorId: number;
    remark?: string;
}
export declare class QueryDiseaseDto {
    plotId?: number;
    status?: DiseaseStatus;
    severity?: DiseaseSeverity;
    type?: string;
    reporterId?: number;
    startDate?: string;
    endDate?: string;
    isOverdue?: boolean;
}
export declare class CreateTimelineDto {
    diseaseId: number;
    operatorId: number;
    action: string;
    content?: string;
    operatedAt: string;
}
