import { v4 as uuidv4 } from 'uuid';
import type { Assessment, AssessmentStatus, AssessmentType, ResponsibleParty } from '@/types';
import { mockAssessments, getAssessmentById, getAssessmentsByOrder, getAssessmentsByRider } from '@/mock/assessments';
import { calculateAssessment } from '@/utils/assessmentRules';

export function getAllAssessments(): Assessment[] {
  return mockAssessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAssessments(options?: {
  status?: AssessmentStatus;
  riderId?: string;
  orderId?: string;
  responsibleParty?: ResponsibleParty;
}): Assessment[] {
  let assessments = [...mockAssessments];

  if (options?.status) {
    assessments = assessments.filter(a => a.status === options.status);
  }
  if (options?.riderId) {
    assessments = assessments.filter(a => a.riderId === options.riderId);
  }
  if (options?.orderId) {
    assessments = assessments.filter(a => a.orderId === options.orderId);
  }
  if (options?.responsibleParty) {
    assessments = assessments.filter(a => a.responsibleParty === options.responsibleParty);
  }

  return assessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAssessmentDetail(id: string): Assessment | undefined {
  return getAssessmentById(id);
}

export function calculateAssessmentResult(
  type: AssessmentType,
  responsibleParty: ResponsibleParty,
  severity: 'minor' | 'moderate' | 'severe' = 'moderate',
  riderId?: string
) {
  const isRepeatOffense = riderId
    ? getAssessmentsByRider(riderId).filter(a => a.type === type && a.status === 'approved').length >= 2
    : false;

  return calculateAssessment(type, responsibleParty, severity, isRepeatOffense);
}

export function createAssessment(data: {
  riderId: string;
  orderId: string;
  riderName: string;
  type: AssessmentType;
  responsibleParty: ResponsibleParty;
  reason: string;
  notes: string;
  severity: 'minor' | 'moderate' | 'severe';
  scoreDeducted: number;
  fineAmount: number;
  requiresTraining: boolean;
  createdBy: string;
}): Assessment {
  const assessment: Assessment = {
    ...data,
    id: `assessment-${uuidv4().slice(0, 8)}`,
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null,
    trainingId: null,
  };
  mockAssessments.push(assessment);
  return assessment;
}

export function createAssessmentDraft(data: {
  riderId: string;
  orderId: string;
  riderName: string;
  type: AssessmentType;
  responsibleParty: ResponsibleParty;
  reason: string;
  notes: string;
  severity: 'minor' | 'moderate' | 'severe';
  scoreDeducted: number;
  fineAmount: number;
  requiresTraining: boolean;
  createdBy: string;
}): Assessment {
  const assessment = createAssessment(data);
  assessment.status = 'draft';
  return assessment;
}

export function submitForApproval(assessmentId: string): Assessment | undefined {
  const assessment = getAssessmentById(assessmentId);
  if (assessment && assessment.status === 'draft') {
    assessment.status = 'pending_approval';
  }
  return assessment;
}

export function approveAssessment(
  assessmentId: string,
  approvedBy: string
): Assessment | undefined {
  const assessment = getAssessmentById(assessmentId);
  if (assessment) {
    assessment.status = 'approved';
    assessment.approvedBy = approvedBy;
    assessment.approvedAt = new Date().toISOString();
  }
  return assessment;
}

export function rejectAssessment(
  assessmentId: string,
  reason: string
): Assessment | undefined {
  const assessment = getAssessmentById(assessmentId);
  if (assessment) {
    assessment.status = 'rejected';
    assessment.reason = `${assessment.reason}\n\n驳回原因：${reason}`;
    assessment.approvedAt = new Date().toISOString();
  }
  return assessment;
}

export function appealAssessment(
  assessmentId: string,
  appealReason: string
): Assessment | undefined {
  const assessment = getAssessmentById(assessmentId);
  if (assessment && assessment.status === 'approved') {
    assessment.status = 'appealed';
    assessment.reason = `${assessment.reason}\n\n申诉原因：${appealReason}`;
  }
  return assessment;
}

export function updateTrainingId(assessmentId: string, trainingId: string): Assessment | undefined {
  const assessment = getAssessmentById(assessmentId);
  if (assessment) {
    assessment.trainingId = trainingId;
  }
  return assessment;
}

export function getPendingCount(): number {
  return getPendingAssessments().length;
}

export function getRiderTotalScore(riderId: string): number {
  const approvedAssessments = getAssessmentsByRider(riderId).filter(a => a.status === 'approved');
  return approvedAssessments.reduce((sum, a) => sum + a.scoreDeducted, 0);
}

export function getRiderCurrentMonthScore(riderId: string): number {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const approvedAssessments = getAssessmentsByRider(riderId).filter(
    a => a.status === 'approved' && new Date(a.createdAt) >= monthStart
  );
  return approvedAssessments.reduce((sum, a) => sum + a.scoreDeducted, 0);
}

export function getAssessmentsByOrderId(orderId: string): Assessment[] {
  return getAssessmentsByOrder(orderId);
}

export function getAssessmentsByRiderId(riderId: string): Assessment[] {
  return getAssessmentsByRider(riderId);
}

export function getPendingAssessments(): Assessment[] {
  return mockAssessments.filter(a => a.status === 'pending_approval' || a.status === 'draft');
}

export function getResponsibilityStats(riderId: string): Record<string, number> {
  const riderAssessments = getAssessmentsByRider(riderId).filter(a => a.status === 'approved');
  const stats: Record<string, number> = {
    rider: 0,
    merchant: 0,
    platform: 0,
    user: 0,
    unclear: 0,
  };
  
  riderAssessments.forEach(a => {
    const party = a.responsibleParty || 'unclear';
    stats[party] = (stats[party] || 0) + 1;
  });
  
  return stats;
}

export { getSeverityLabel, getResponsiblePartyLabel } from '@/utils/labels';
