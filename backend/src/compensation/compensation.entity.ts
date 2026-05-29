export interface Compensation {
  id: string;
  workOrderId: string;
  type: 'full_refund' | 'partial_refund' | 'rework' | 'discount' | 'other';
  amount: number;
  customerCost: number;
  labCost: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';
  ownerReview?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
