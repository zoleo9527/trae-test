import { Disease } from '../disease/disease.entity';
import { Plot } from '../plot/plot.entity';
import { User } from '../user/user.entity';
export declare enum InspectionStatus {
    PENDING = "pending",
    COMPLETED = "completed"
}
export declare class Inspection {
    id: number;
    plot: Plot;
    plotId: number;
    inspector: User;
    inspectorId: number;
    growthStatus: string;
    soilCondition: string;
    moistureCondition: string;
    remark: string;
    status: InspectionStatus;
    inspectionDate: string;
    hasDisease: boolean;
    disease: Disease;
    createdAt: Date;
    updatedAt: Date;
}
