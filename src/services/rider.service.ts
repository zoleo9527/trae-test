import type { Rider, RiderStatus, TimelineEvent } from '@/types';
import { mockRiders, getRidersByRegion } from '@/mock/riders';
import { getRiderTotalScore, getRiderCurrentMonthScore, getAssessmentsByRiderId } from './assessment.service';
import { getRiderTrainingCount, getTrainingsByRiderId } from './training.service';
import { getOrders } from './order.service';

export function getAllRiders(): Rider[] {
  return mockRiders;
}

export function getRiders(options?: {
  status?: RiderStatus;
  region?: string;
}): Rider[] {
  let riders = [...mockRiders];

  if (options?.status) {
    riders = riders.filter(r => r.status === options.status);
  }
  if (options?.region) {
    riders = riders.filter(r => r.region === options.region);
  }

  return riders;
}

export function getRiderDetail(id: string): Rider | undefined {
  const rider = getRiderById(id);
  if (rider) {
    rider.totalScore = 100 - getRiderTotalScore(id);
    rider.currentMonthScore = getRiderCurrentMonthScore(id);
    rider.trainingCount = getRiderTrainingCount(id);
  }
  return rider;
}

export function getRidersByRegionName(region: string): Rider[] {
  return getRidersByRegion(region);
}

export function updateRiderStatus(riderId: string, status: RiderStatus): Rider | undefined {
  const rider = getRiderById(riderId);
  if (rider) {
    rider.status = status;
  }
  return rider;
}

export function getRegions(): string[] {
  const regions = new Set(mockRiders.map(r => r.region));
  return Array.from(regions);
}

export function getRiderStats(riderId: string) {
  const totalScore = getRiderTotalScore(riderId);
  const currentMonthScore = getRiderCurrentMonthScore(riderId);
  const trainingCount = getRiderTrainingCount(riderId);

  return {
    totalScore: 100 - totalScore,
    currentMonthScore,
    trainingCount,
  };
}

export function getRiderById(id: string) {
  return mockRiders.find(r => r.id === id);
}

export function buildRiderTimeline(riderId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const riderOrders = getOrders({ riderId });
  const riderAssessments = getAssessmentsByRiderId(riderId);
  const riderTrainings = getTrainingsByRiderId(riderId);

  riderOrders.forEach(order => {
    events.push({
      id: `order-${order.id}`,
      type: 'order',
      timestamp: order.createdAt,
      title: `订单 ${order.id}`,
      description: `${order.merchantName} → ${order.userName}`,
      data: { status: order.status, orderId: order.id },
    });
  });

  riderAssessments.forEach(assessment => {
    events.push({
      id: `assessment-${assessment.id}`,
      type: 'assessment',
      timestamp: assessment.createdAt,
      title: `考核：扣 ${assessment.scoreDeducted} 分`,
      description: assessment.reason,
      data: { status: assessment.status, assessmentId: assessment.id, scoreDeducted: assessment.scoreDeducted },
    });
  });

  riderTrainings.forEach(training => {
    events.push({
      id: `training-${training.id}`,
      type: 'training',
      timestamp: training.createdAt,
      title: training.title,
      description: training.description,
      data: { status: training.status, trainingId: training.id, score: training.score },
    });
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
