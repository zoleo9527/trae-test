export enum UserRole {
  BASE_MANAGER = 'base_manager',
  INSPECTOR = 'inspector',
  SALES = 'sales',
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plot {
  id: number;
  name: string;
  location: string;
  variety: string;
  specification: string;
  quantity: number;
  inspectorId: number;
  inspector: User;
  createdAt: string;
  updatedAt: string;
}

export enum InspectionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface Inspection {
  id: number;
  plotId: number;
  plot: Plot;
  inspectorId: number;
  inspector: User;
  growthStatus: string;
  soilCondition: string;
  moistureCondition: string;
  remark: string;
  status: InspectionStatus;
  inspectionDate: string;
  hasDisease: boolean;
  disease?: Disease;
  createdAt: string;
  updatedAt: string;
}

export enum DiseaseSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
}

export enum DiseaseStatus {
  REPORTED = 'reported',
  CONFIRMED = 'confirmed',
  TREATING = 'treating',
  RESOLVED = 'resolved',
}

export interface DiseaseTimeline {
  id: number;
  diseaseId: number;
  operatorId: number;
  operator: User;
  action: string;
  content: string;
  operatedAt: string;
}

export interface Disease {
  id: number;
  inspectionId?: number;
  inspection?: Inspection;
  plotId: number;
  plot: Plot;
  reporterId: number;
  reporter: User;
  type: string;
  severity: DiseaseSeverity;
  description?: string;
  affectedQuantity?: number;
  status: DiseaseStatus;
  reportedAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  isOverdue: boolean;
  timelines: DiseaseTimeline[];
  negotiations: Negotiation[];
  createdAt: string;
  updatedAt: string;
}

export enum NegotiationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  CONFIRMED = 'confirmed',
  CLOSED = 'closed',
}

export interface Negotiation {
  id: number;
  diseaseId: number;
  disease: Disease;
  initiatorId: number;
  initiator: User;
  confirmedById?: number;
  confirmedBy?: User;
  salesOpinion: string;
  baseOpinion: string;
  replantQuantity: number;
  replantVariety: string;
  replantDate: string;
  status: NegotiationStatus;
  createdAt: string;
  confirmedAt?: string;
  updatedAt: string;
}

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
    time: string;
  }>;
  usersByRole: Record<string, number>;
}

export interface QueryUserDto {
  role?: string;
  name?: string;
}

export interface QueryPlotDto {
  name?: string;
  location?: string;
  variety?: string;
  inspectorId?: number;
}

export interface QueryInspectionDto {
  plotId?: number;
  inspectorId?: number;
  status?: string;
  hasDisease?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface QueryDiseaseDto {
  plotId?: number;
  status?: string;
  severity?: string;
  type?: string;
  reporterId?: number;
  startDate?: string;
  endDate?: string;
  isOverdue?: boolean;
}

export interface QueryNegotiationDto {
  diseaseId?: number;
  status?: string;
  initiatorId?: number;
  replantDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateUserDto {
  name: string;
  role: string;
  phone?: string;
}

export interface CreatePlotDto {
  name: string;
  location?: string;
  variety?: string;
  specification?: string;
  quantity?: number;
  inspectorId: number;
}

export interface CreateInspectionDto {
  plotId: number;
  inspectorId: number;
  growthStatus?: string;
  soilCondition?: string;
  moistureCondition?: string;
  remark?: string;
  status?: string;
  inspectionDate: string;
  hasDisease?: boolean;
}

export interface CreateDiseaseDto {
  inspectionId: number;
  plotId: number;
  reporterId: number;
  type: string;
  severity: string;
  description?: string;
  affectedQuantity?: number;
  reportedAt: string;
  status?: string;
}

export interface CreateNegotiationDto {
  diseaseId: number;
  initiatorId: number;
  salesOpinion?: string;
  baseOpinion?: string;
  replantQuantity?: number;
  replantVariety?: string;
  replantDate?: string;
  status?: string;
}

export interface UpdateDiseaseStatusDto {
  status: string;
  operatorId: number;
  remark?: string;
}

export interface UpdateNegotiationStatusDto {
  status: string;
  operatorId: number;
  salesOpinion?: string;
  baseOpinion?: string;
  replantQuantity?: number;
  replantVariety?: string;
  replantDate?: string;
}
