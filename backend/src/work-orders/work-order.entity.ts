export interface WorkOrder {
  id: string;
  orderNumber: string;
  category: 'refund' | 'compensation' | 'rework' | 'complaint';
  problemType?: 'mixed_roll' | 'wrong_version' | 'quality_issue' | 'delay' | 'other';
  title: string;
  description?: string;
  status: 'pending' | 'negotiating' | 'reviewing' | 'approved' | 'completed' | 'closed';
  filmRollId?: string;
  assigneeId?: string;
  requestedAmount?: number;
  originalPrice?: number;
  hasEvidence?: boolean;
  evidenceUrls?: string[];
  negotiationSummary?: string;
  reviewConclusion?: string;
  closedAt?: string;
  ownerReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusLog {
  id: string;
  workOrderId: string;
  fromStatus: string;
  toStatus: string;
  remark?: string;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  workOrderId: string;
  content: string;
  type: 'internal' | 'customer' | 'negotiation' | 'review';
  isPrivate: boolean;
  creatorId?: string;
  creatorName?: string;
  creatorRole?: string;
  createdAt: string;
}
