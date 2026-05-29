import { Repository } from 'typeorm';
import { Disease } from '../disease/disease.entity';
import { Inspection } from '../inspection/inspection.entity';
import { Negotiation } from '../negotiation/negotiation.entity';
import { Plot } from '../plot/plot.entity';
import { User } from '../user/user.entity';
export interface DashboardStats {
    totalPlots: number;
    totalInspections: number;
    pendingInspections: number;
    totalDiseases: number;
    activeDiseases: number;
    overdueDiseases: number;
    totalNegotiations: number;
    pendingNegotiations: number;
    diseaseBySeverity: Record<string, number>;
    diseaseByStatus: Record<string, number>;
    recentActivities: Array<{
        id: number;
        type: 'inspection' | 'disease' | 'negotiation';
        title: string;
        status: string;
        time: Date;
    }>;
    usersByRole: Record<string, number>;
}
export declare class DashboardService {
    private readonly plotRepository;
    private readonly inspectionRepository;
    private readonly diseaseRepository;
    private readonly negotiationRepository;
    private readonly userRepository;
    constructor(plotRepository: Repository<Plot>, inspectionRepository: Repository<Inspection>, diseaseRepository: Repository<Disease>, negotiationRepository: Repository<Negotiation>, userRepository: Repository<User>);
    getStats(): Promise<DashboardStats>;
}
