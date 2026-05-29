export type UserRole = 'manager' | 'dispatcher' | 'customer_service';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  zone?: string;
}

export type OrderStatus = 'pending' | 'picked_up' | 'delivered' | 'cancelled' | 'exception';
export type AppealType = 'timeout' | 'wrong_item' | 'damage' | 'rude' | 'refund' | 'other';
export type AppealStatus = 'pending' | 'processing' | 'resolved' | 'rejected';
export type SubsidyType = 'merchant_delay' | 'weather' | 'traffic' | 'address' | 'other';
export type SubsidyStatus = 'pending' | 'approved' | 'rejected';
export type AssessmentType = 'timeout' | 'complaint' | 'violation' | 'service_issue';
export type AssessmentStatus = 'draft' | 'pending_approval' | 'approved' | 'appealed' | 'rejected';
export type TrainingType = 'mandatory' | 'remedial' | 'optional';
export type TrainingStatus = 'pending' | 'in_progress' | 'completed' | 'expired';
export type RiderStatus = 'active' | 'inactive' | 'suspended';
export type ResponsibleParty = 'rider' | 'merchant' | 'platform' | 'user' | 'unclear';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  riderId: string;
  merchantId: string;
  userId: string;
  merchantName: string;
  userName: string;
  riderName: string;
  userPhone: string;
  createdAt: string;
  promisedTime: string;
  merchantReadyTime: string;
  pickedUpTime: string;
  deliveredTime: string;
  amount: number;
  status: OrderStatus;
  region: string;
  deliveryAddress: string;
  address: string;
  items: OrderItem[];
  hasAppeal: boolean;
  hasSubsidy: boolean;
  hasAssessment: boolean;
  hasTraining: boolean;
}

export interface Appeal {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  type: AppealType;
  reason: string;
  description: string;
  evidenceUrls: string[];
  images: string[];
  status: AppealStatus;
  handlerRole: UserRole | null;
  handlerName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  responsibleParty: ResponsibleParty | null;
}

export interface Subsidy {
  id: string;
  orderId: string;
  riderName: string;
  type: SubsidyType;
  reason: string;
  notes: string;
  amount: number;
  status: SubsidyStatus;
  approvedBy: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface Assessment {
  id: string;
  riderId: string;
  orderId: string;
  riderName: string;
  type: AssessmentType;
  scoreDeducted: number;
  fineAmount: number;
  reason: string;
  notes: string;
  severity: 'minor' | 'moderate' | 'severe';
  responsibleParty: ResponsibleParty;
  status: AssessmentStatus;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  requiresTraining: boolean;
  trainingId: string | null;
}

export interface Training {
  id: string;
  riderId: string;
  riderName: string;
  assessmentId: string | null;
  orderId: string;
  title: string;
  type: TrainingType;
  content: string;
  description: string;
  status: TrainingStatus;
  dueDate: string;
  completedAt: string | null;
  score: number | null;
  createdAt: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  region: string;
  zone: string;
  joinDate: string;
  status: RiderStatus;
  totalScore: number;
  currentScore: number;
  totalOrders: number;
  totalDeliveries: number;
  currentMonthScore: number;
  trainingCount: {
    pending: number;
    completed: number;
    overdue: number;
  };
}

export interface TimelineEvent {
  id: string;
  type: 'order' | 'appeal' | 'subsidy' | 'assessment' | 'training' | 'status_change';
  timestamp: string;
  title: string;
  description: string;
  data: Record<string, any>;
}

export type ProcessStep = 'review' | 'appeal' | 'subsidy' | 'assessment' | 'training' | 'complete';

export interface ProcessState {
  orderId: string;
  currentStep: ProcessStep;
  completedSteps: ProcessStep[];
  appealDecision: Appeal | null;
  subsidyDecision: Subsidy | null;
  assessmentDecision: Assessment | null;
  autoTriggeredTraining: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  exceptionOrders: number;
  pendingAppeals: number;
  pendingSubsidies: number;
  pendingAssessments: number;
  pendingTrainings: number;
  avgDeliveryTime: number;
  onTimeRate: number;
}

export interface ResponsibilityResult {
  party: ResponsibleParty;
  confidence: number;
  reasons: string[];
}

export interface TrainingTriggerResult {
  shouldTrigger: boolean;
  trainingType: TrainingType;
  reason: string;
  title: string;
  content: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'appeal' | 'subsidy' | 'assessment' | 'training';
  orderId: string;
  riderName: string;
  createdAt: string;
}
