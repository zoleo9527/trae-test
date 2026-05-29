export enum MaterialStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELIVERED = 'delivered',
  INSTALLED = 'installed',
  DAMAGED = 'damaged',
  RETURNED = 'returned',
}

export const MaterialStatusTransitions: Record<MaterialStatus, MaterialStatus[]> = {
  [MaterialStatus.DRAFT]: [MaterialStatus.PENDING_REVIEW],
  [MaterialStatus.PENDING_REVIEW]: [MaterialStatus.APPROVED, MaterialStatus.REJECTED],
  [MaterialStatus.APPROVED]: [MaterialStatus.DELIVERED],
  [MaterialStatus.REJECTED]: [MaterialStatus.DRAFT],
  [MaterialStatus.DELIVERED]: [MaterialStatus.INSTALLED, MaterialStatus.DAMAGED],
  [MaterialStatus.INSTALLED]: [MaterialStatus.RETURNED],
  [MaterialStatus.DAMAGED]: [MaterialStatus.RETURNED],
  [MaterialStatus.RETURNED]: [],
};
