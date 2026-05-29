import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disease, DiseaseSeverity, DiseaseStatus } from '../disease/disease.entity';
import { Inspection, InspectionStatus } from '../inspection/inspection.entity';
import { Negotiation, NegotiationStatus } from '../negotiation/negotiation.entity';
import { Plot } from '../plot/plot.entity';
import { User, UserRole } from '../user/user.entity';

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

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Plot)
    private readonly plotRepository: Repository<Plot>,
    @InjectRepository(Inspection)
    private readonly inspectionRepository: Repository<Inspection>,
    @InjectRepository(Disease)
    private readonly diseaseRepository: Repository<Disease>,
    @InjectRepository(Negotiation)
    private readonly negotiationRepository: Repository<Negotiation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [
      totalPlots,
      totalInspections,
      pendingInspections,
      totalDiseases,
      activeDiseases,
      overdueDiseases,
      totalNegotiations,
      pendingNegotiations,
    ] = await Promise.all([
      this.plotRepository.count(),
      this.inspectionRepository.count(),
      this.inspectionRepository.count({ where: { status: InspectionStatus.PENDING } }),
      this.diseaseRepository.count(),
      this.diseaseRepository.count({ where: { status: DiseaseStatus.REPORTED } }),
      this.diseaseRepository.count({ where: { isOverdue: true } }),
      this.negotiationRepository.count(),
      this.negotiationRepository.count({ where: { status: NegotiationStatus.IN_PROGRESS } }),
    ]);

    const diseaseBySeverity = {
      [DiseaseSeverity.MINOR]: await this.diseaseRepository.count({ where: { severity: DiseaseSeverity.MINOR } }),
      [DiseaseSeverity.MODERATE]: await this.diseaseRepository.count({ where: { severity: DiseaseSeverity.MODERATE } }),
      [DiseaseSeverity.MAJOR]: await this.diseaseRepository.count({ where: { severity: DiseaseSeverity.MAJOR } }),
    };

    const diseaseByStatus = {
      [DiseaseStatus.REPORTED]: await this.diseaseRepository.count({ where: { status: DiseaseStatus.REPORTED } }),
      [DiseaseStatus.CONFIRMED]: await this.diseaseRepository.count({ where: { status: DiseaseStatus.CONFIRMED } }),
      [DiseaseStatus.TREATING]: await this.diseaseRepository.count({ where: { status: DiseaseStatus.TREATING } }),
      [DiseaseStatus.RESOLVED]: await this.diseaseRepository.count({ where: { status: DiseaseStatus.RESOLVED } }),
    };

    const usersByRole = {
      [UserRole.BASE_MANAGER]: await this.userRepository.count({ where: { role: UserRole.BASE_MANAGER } }),
      [UserRole.INSPECTOR]: await this.userRepository.count({ where: { role: UserRole.INSPECTOR } }),
      [UserRole.SALES]: await this.userRepository.count({ where: { role: UserRole.SALES } }),
    };

    const recentInspections = await this.inspectionRepository.find({
      relations: ['plot'],
      order: { createdAt: 'DESC' },
      take: 3,
    });

    const recentDiseases = await this.diseaseRepository.find({
      relations: ['plot'],
      order: { reportedAt: 'DESC' },
      take: 3,
    });

    const recentNegotiations = await this.negotiationRepository.find({
      relations: ['disease', 'disease.plot'],
      order: { createdAt: 'DESC' },
      take: 3,
    });

    const recentActivities = [
      ...recentInspections.map(i => ({
        id: i.id,
        type: 'inspection' as const,
        title: `${i.plot.name} 巡查`,
        status: i.status,
        time: i.createdAt,
      })),
      ...recentDiseases.map(d => ({
        id: d.id,
        type: 'disease' as const,
        title: `${d.plot.name} ${d.type}`,
        status: d.status,
        time: d.reportedAt,
      })),
      ...recentNegotiations.map(n => ({
        id: n.id,
        type: 'negotiation' as const,
        title: `${n.disease.plot.name} 补苗协商`,
        status: n.status,
        time: n.createdAt,
      })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

    return {
      totalPlots,
      totalInspections,
      pendingInspections,
      totalDiseases,
      activeDiseases,
      overdueDiseases,
      totalNegotiations,
      pendingNegotiations,
      diseaseBySeverity,
      diseaseByStatus,
      recentActivities,
      usersByRole,
    };
  }
}
