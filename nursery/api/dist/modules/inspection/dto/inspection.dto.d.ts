import { InspectionStatus } from '../inspection.entity';
export declare class CreateInspectionDto {
    plotId: number;
    inspectorId: number;
    growthStatus?: string;
    soilCondition?: string;
    moistureCondition?: string;
    remark?: string;
    status?: InspectionStatus;
    inspectionDate: string;
    hasDisease?: boolean;
}
export declare class QueryInspectionDto {
    plotId?: number;
    inspectorId?: number;
    status?: InspectionStatus;
    hasDisease?: boolean;
    startDate?: string;
    endDate?: string;
}
