export type UserRole = 'consultant_manager' | 'copywriter' | 'visa_assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type StudentStatus = 'consulting' | 'contract_signed' | 'document_prep' | 'application_submitted' | 'visa_processing' | 'completed';

export type DocumentType = 'personal_statement' | 'recommendation_letter' | 'resume' | 'transcript' | 'language_score' | 'financial_proof' | 'other';

export type DocumentStatus = 'pending' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'overdue';

export type VisaStatus = 'not_started' | 'documents_preparing' | 'submitted' | 'interview_scheduled' | 'approved' | 'rejected' | 'refund_in_progress';

export type DeadlineType = 'document_submission' | 'application_deadline' | 'visa_appointment' | 'tuition_payment' | 'embarkation';

export interface Student {
  id: string;
  name: string;
  englishName?: string;
  phone: string;
  email: string;
  targetCountry: string;
  targetSchool: string;
  targetMajor: string;
  status: StudentStatus;
  consultantId: string;
  copywriterId?: string;
  visaAssistantId?: string;
  contractDate?: string;
  expectedStartDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  comment?: string;
}

export interface Document {
  id: string;
  studentId: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  assignedTo?: string;
  deadline?: string;
  currentVersion: number;
  versions: DocumentVersion[];
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deadline {
  id: string;
  studentId: string;
  title: string;
  type: DeadlineType;
  date: string;
  description?: string;
  isCompleted: boolean;
  relatedDocumentId?: string;
  createdAt: string;
}

export interface VisaRecord {
  id: string;
  studentId: string;
  status: VisaStatus;
  country: string;
  appointmentDate?: string;
  submissionDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
  refundAmount?: number;
  refundDate?: string;
  notes: VisaNote[];
  createdAt: string;
  updatedAt: string;
}

export interface VisaNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: 'update' | 'issue' | 'resolution' | 'refund';
}

export interface Message {
  id: string;
  studentId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  relatedEntity?: {
    type: 'document' | 'visa' | 'deadline';
    id: string;
  };
}

export interface ActivityLog {
  id: string;
  studentId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: Record<string, any>;
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory = 'document_version' | 'deadline_missed' | 'refund_negotiation' | 'visa_issue' | 'communication';

export interface Issue {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  description: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  history: IssueHistory[];
}

export interface IssueHistory {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  comment?: string;
  oldValue?: string;
  newValue?: string;
}
