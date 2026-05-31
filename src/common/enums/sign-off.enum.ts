export enum SignOffStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum SignOffType {
  CHANGE_ORDER = 'change_order',
  DAILY_REPORT = 'daily_report',
  DELIVERY = 'delivery',
  QUALITY_CHECK = 'quality_check',
  SAFETY_CHECK = 'safety_check',
}

export enum SignOffAction {
  SIGN = 'sign',
  REJECT = 'reject',
  REQUEST_REVIEW = 'request_review',
}
