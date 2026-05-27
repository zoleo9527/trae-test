export class BatchReviewItem {
  refundId: string;
  action: 'APPROVE' | 'REJECT' | 'NEED_INSPECTION';
  remark?: string;
}

export class BatchReviewDto {
  reviewerId: string;
  items: BatchReviewItem[];
}

export class BatchReviewResult {
  successCount: number;
  failCount: number;
  results: Array<{
    refundId: string;
    success: boolean;
    message?: string;
  }>;
}
