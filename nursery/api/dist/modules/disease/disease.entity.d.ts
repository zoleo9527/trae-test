import { Inspection } from '../inspection/inspection.entity';
import { Negotiation } from '../negotiation/negotiation.entity';
import { Plot } from '../plot/plot.entity';
import { User } from '../user/user.entity';
import { DiseaseTimeline } from './disease-timeline.entity';
export declare enum DiseaseSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    MAJOR = "major"
}
export declare enum DiseaseStatus {
    REPORTED = "reported",
    CONFIRMED = "confirmed",
    TREATING = "treating",
    RESOLVED = "resolved"
}
export declare class Disease {
    id: number;
    inspection: Inspection;
    inspectionId: number;
    plot: Plot;
    plotId: number;
    reporter: User;
    reporterId: number;
    type: string;
    severity: DiseaseSeverity;
    description: string;
    affectedQuantity: number;
    status: DiseaseStatus;
    reportedAt: Date;
    confirmedAt: Date;
    resolvedAt: Date;
    isOverdue: boolean;
    timelines: DiseaseTimeline[];
    negotiations: Negotiation[];
    createdAt: Date;
    updatedAt: Date;
}
