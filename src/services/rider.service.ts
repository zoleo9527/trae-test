import type { Rider, RiderStatus } from '@/types';
import { mockRiders, getRidersByRegion } from '@/mock/riders';
import { getRiderTotalScore, getRiderCurrentMonthScore } from './assessment.service';
import { getRiderTrainingCount } from './training.service';

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

export function buildRiderTimeline(riderId: string) {
  return [];
}
