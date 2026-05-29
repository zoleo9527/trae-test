export enum SettlementStatus {
  DRAFT = 'draft',
  PENDING_CONFIRM = 'pending_confirm',
  SUPPLIER_CONFIRMED = 'supplier_confirmed',
  AUDITING = 'auditing',
  AUDIT_PASSED = 'audit_passed',
  AUDIT_REJECTED = 'audit_rejected',
  PAYMENT_SCHEDULED = 'payment_scheduled',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

export const SettlementStatusTransitions: Record<SettlementStatus, SettlementStatus[]> = {
  [SettlementStatus.DRAFT]: [SettlementStatus.PENDING_CONFIRM],
  [SettlementStatus.PENDING_CONFIRM]: [SettlementStatus.SUPPLIER_CONFIRMED, SettlementStatus.DISPUTED],
  [SettlementStatus.SUPPLIER_CONFIRMED]: [SettlementStatus.AUDITING],
  [SettlementStatus.AUDITING]: [SettlementStatus.AUDIT_PASSED, SettlementStatus.AUDIT_REJECTED],
  [SettlementStatus.AUDIT_PASSED]: [SettlementStatus.PAYMENT_SCHEDULED],
  [SettlementStatus.AUDIT_REJECTED]: [SettlementStatus.DRAFT],
  [SettlementStatus.PAYMENT_SCHEDULED]: [SettlementStatus.PAID],
  [SettlementStatus.PAID]: [],
  [SettlementStatus.DISPUTED]: [SettlementStatus.DRAFT],
};
