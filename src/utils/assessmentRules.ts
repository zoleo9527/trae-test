import type { AssessmentType, ResponsibleParty } from '@/types';
import { getResponsiblePartyLabel } from './labels';

export interface AssessmentRule {
  type: AssessmentType;
  minScore: number;
  maxScore: number;
  minFine: number;
  maxFine: number;
  description: string;
  triggersTrainingAt: number;
}

export const ASSESSMENT_RULES: Record<AssessmentType, AssessmentRule> = {
  timeout: {
    type: 'timeout',
    minScore: 2,
    maxScore: 10,
    minFine: 10,
    maxFine: 100,
    description: '配送超时',
    triggersTrainingAt: 5,
  },
  complaint: {
    type: 'complaint',
    minScore: 3,
    maxScore: 15,
    minFine: 50,
    maxFine: 300,
    description: '用户投诉',
    triggersTrainingAt: 5,
  },
  violation: {
    type: 'violation',
    minScore: 5,
    maxScore: 20,
    minFine: 100,
    maxFine: 500,
    description: '违规操作',
    triggersTrainingAt: 5,
  },
  service_issue: {
    type: 'service_issue',
    minScore: 2,
    maxScore: 8,
    minFine: 20,
    maxFine: 100,
    description: '服务问题',
    triggersTrainingAt: 5,
  },
};

export interface CalculatedAssessment {
  scoreDeducted: number;
  fineAmount: number;
  requiresTraining: boolean;
  reasoning: string[];
}

export function calculateAssessment(
  type: AssessmentType,
  responsibleParty: ResponsibleParty,
  severity: 'minor' | 'moderate' | 'severe' = 'moderate',
  isRepeatOffense: boolean = false
): CalculatedAssessment {
  const rule = ASSESSMENT_RULES[type];
  const reasoning: string[] = [];

  if (responsibleParty !== 'rider') {
    return {
      scoreDeducted: 0,
      fineAmount: 0,
      requiresTraining: false,
      reasoning: [`责任方为${getResponsiblePartyLabel(responsibleParty)}，不对骑手进行考核`],
    };
  }

  let scoreMultiplier = 1;
  let fineMultiplier = 1;

  if (severity === 'minor') {
    scoreMultiplier = 0.5;
    fineMultiplier = 0.5;
    reasoning.push('情节较轻，扣分和罚款减半');
  } else if (severity === 'severe') {
    scoreMultiplier = 1.5;
    fineMultiplier = 1.5;
    reasoning.push('情节严重，扣分和罚款加倍');
  }

  if (isRepeatOffense) {
    scoreMultiplier *= 1.5;
    fineMultiplier *= 1.5;
    reasoning.push('30天内重复违规，扣分和罚款追加50%');
  }

  const midScore = (rule.minScore + rule.maxScore) / 2;
  const midFine = (rule.minFine + rule.maxFine) / 2;

  const scoreDeducted = Math.round(midScore * scoreMultiplier);
  const fineAmount = Math.round(midFine * fineMultiplier);

  const requiresTraining = scoreDeducted >= rule.triggersTrainingAt;

  if (requiresTraining) {
    reasoning.push(`扣分 ${scoreDeducted} 分 ≥ 触发培训阈值 ${rule.triggersTrainingAt} 分，需参加培训`);
  }

  reasoning.unshift(`违规类型：${rule.description}`);

  return {
    scoreDeducted,
    fineAmount,
    requiresTraining,
    reasoning,
  };
}

export {
  getAssessmentTypeLabel,
  getAssessmentStatusLabel,
  getAssessmentStatusVariant as getAssessmentStatusColor,
  getSeverityLabel,
  getResponsiblePartyLabel,
} from './labels';
