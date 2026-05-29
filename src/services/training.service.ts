import { getAssessmentById } from '@/mock/assessments';
import { getRiderById } from '@/mock/riders';
import { getTrainingById, getTrainingsByRider, mockTrainings } from '@/mock/trainings';
import type { Training, TrainingStatus, TrainingType } from '@/types';
import { shouldTriggerTraining } from '@/utils/trainingTrigger';
import { v4 as uuidv4 } from 'uuid';
import { getAssessments } from './assessment.service';

export function getAllTrainings(): Training[] {
  return mockTrainings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTrainings(options?: {
  status?: TrainingStatus;
  riderId?: string;
  assessmentId?: string;
  type?: TrainingType;
}): Training[] {
  let trainings = [...mockTrainings];

  if (options?.status) {
    trainings = trainings.filter(t => t.status === options.status);
  }
  if (options?.riderId) {
    trainings = trainings.filter(t => t.riderId === options.riderId);
  }
  if (options?.assessmentId) {
    trainings = trainings.filter(t => t.assessmentId === options.assessmentId);
  }
  if (options?.type) {
    trainings = trainings.filter(t => t.type === options.type);
  }

  return trainings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTrainingDetail(id: string): Training | undefined {
  return getTrainingById(id);
}

export function checkTrainingTrigger(assessmentId: string, riderId: string) {
  const assessment = getTrainings().flatMap(t => t.assessmentId === assessmentId ? [] : [])[0];
  const allAssessments = getAssessments();
  const rider = getRiderById(riderId);
  const assessmentData = allAssessments.find(a => a.id === assessmentId);

  if (!assessmentData || !rider) {
    return {
      shouldTrigger: false,
      trainingType: 'refresh' as TrainingType,
      reason: '数据不完整，无法判定',
      title: '',
      content: '',
    };
  }

  return shouldTriggerTraining(assessmentData, rider, allAssessments);
}

export function createTraining(data: {
  riderId: string;
  riderName: string;
  orderId: string;
  description: string;
  assessmentId?: string;
  title: string;
  type: TrainingType;
  content: string;
  dueDate?: string;
}): Training {
  const dueDate = data.dueDate || getDefaultDueDate();
  const training: Training = {
    id: `training-${uuidv4().slice(0, 8)}`,
    riderId: data.riderId,
    riderName: data.riderName,
    orderId: data.orderId,
    description: data.description,
    assessmentId: data.assessmentId || null,
    title: data.title,
    type: data.type,
    content: data.content,
    status: 'pending',
    dueDate,
    completedAt: null,
    score: null,
    createdAt: new Date().toISOString(),
  };
  mockTrainings.push(training);
  return training;
}

export function createTrainingFromAssessment(assessmentId: string, riderId: string): Training | null {
  const triggerResult = checkTrainingTrigger(assessmentId, riderId);
  if (!triggerResult.shouldTrigger) {
    return null;
  }

  const rider = getRiderById(riderId);
  const assessment = getAssessmentById(assessmentId);

  return createTraining({
    riderId,
    riderName: rider?.name || '未知骑手',
    orderId: assessment?.orderId || '',
    description: triggerResult.title,
    assessmentId,
    title: triggerResult.title,
    type: triggerResult.trainingType,
    content: triggerResult.content,
  });
}

export function updateTrainingStatus(
  trainingId: string,
  status: TrainingStatus,
  score?: number
): Training | undefined {
  const training = getTrainingById(trainingId);
  if (training) {
    training.status = status;
    if (status === 'completed') {
      training.completedAt = new Date().toISOString();
      if (score !== undefined) {
        training.score = score;
      }
    }
  }
  return training;
}

export function startTraining(trainingId: string): Training | undefined {
  return updateTrainingStatus(trainingId, 'in_progress');
}

export function completeTraining(trainingId: string, score: number): Training | undefined {
  return updateTrainingStatus(trainingId, 'completed', score);
}

export function getPendingCount(): number {
  return getPendingTrainings().length;
}

export function getOverdueCount(): number {
  return getOverdueTrainings().length;
}

export function getRiderTrainingCount(riderId: string) {
  const riderTrainings = getTrainingsByRider(riderId);
  return {
    pending: riderTrainings.filter(t => t.status === 'pending').length,
    inProgress: riderTrainings.filter(t => t.status === 'in_progress').length,
    completed: riderTrainings.filter(t => t.status === 'completed').length,
    overdue: riderTrainings.filter(
      t => (t.status === 'pending' || t.status === 'in_progress') && new Date(t.dueDate) < new Date()
    ).length,
  };
}

export function getTrainingsByOrderId(orderId: string): Training[] {
  return mockTrainings.filter(t => {
    const assessment = getAssessments().find(a => a.id === t.assessmentId);
    return assessment?.orderId === orderId;
  });
}

export function getTrainingsByRiderId(riderId: string): Training[] {
  return getTrainingsByRider(riderId);
}

export function getPendingTrainings(): Training[] {
  return mockTrainings.filter(t => t.status === 'pending' || t.status === 'in_progress');
}

export function getOverdueTrainings(): Training[] {
  return mockTrainings.filter(
    t => (t.status === 'pending' || t.status === 'in_progress') && new Date(t.dueDate) < new Date()
  );
}

function getDefaultDueDate(): string {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  dueDate.setHours(23, 59, 59, 0);
  return dueDate.toISOString();
}
