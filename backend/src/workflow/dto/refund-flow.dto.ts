import { RefundStatus } from '@prisma/client';

export class SubmitRefundDto {
  packageId: string;
  verificationId?: string;
  customerReason: string;
  refundCount: number;
}

export class CsReviewDto {
  refundId: string;
  csReviewerId: string;
  csOpinion: string;
  needInspection: boolean;
}

export class InspectionSubmitDto {
  refundId: string;
  inspectorId: string;
  inspectionResult: string;
  inspectionPhoto?: string;
}

export class FinalReviewDto {
  refundId: string;
  reviewerId: string;
  finalDecision: 'APPROVED' | 'REJECTED';
}
