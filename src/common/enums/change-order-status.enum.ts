export enum ChangeOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

export enum ChangeOrderType {
  DESIGN_CHANGE = 'design_change',
  MATERIAL_CHANGE = 'material_change',
  CONSTRUCTION_METHOD = 'construction_method',
  SCOPE_CHANGE = 'scope_change',
  SITE_CONDITION = 'site_condition',
  OTHER = 'other',
}

export const ChangeOrderStatusFlow = {
  [ChangeOrderStatus.DRAFT]: [ChangeOrderStatus.SUBMITTED, ChangeOrderStatus.CANCELLED],
  [ChangeOrderStatus.SUBMITTED]: [ChangeOrderStatus.UNDER_REVIEW, ChangeOrderStatus.REJECTED],
  [ChangeOrderStatus.UNDER_REVIEW]: [ChangeOrderStatus.APPROVED, ChangeOrderStatus.REJECTED, ChangeOrderStatus.SUBMITTED],
  [ChangeOrderStatus.APPROVED]: [ChangeOrderStatus.IN_PROGRESS, ChangeOrderStatus.CANCELLED],
  [ChangeOrderStatus.REJECTED]: [ChangeOrderStatus.SUBMITTED, ChangeOrderStatus.CANCELLED],
  [ChangeOrderStatus.IN_PROGRESS]: [ChangeOrderStatus.COMPLETED],
  [ChangeOrderStatus.COMPLETED]: [ChangeOrderStatus.SETTLED],
  [ChangeOrderStatus.SETTLED]: [],
  [ChangeOrderStatus.CANCELLED]: [],
};
