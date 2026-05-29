export enum CredentialType {
  CONSTRUCTION_WORKER = 'construction_worker',
  ELECTRICIAN = 'electrician',
  HEIGHT_WORKER = 'height_worker',
  WELDER = 'welder',
  DRIVER = 'driver',
  SUPERVISOR = 'supervisor',
  VISITOR = 'visitor',
}

export enum CredentialStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PRINTED = 'printed',
  ISSUED = 'issued',
  RETURNED = 'returned',
  EXPIRED = 'expired',
}

export const CredentialStatusTransitions: Record<CredentialStatus, CredentialStatus[]> = {
  [CredentialStatus.DRAFT]: [CredentialStatus.SUBMITTED],
  [CredentialStatus.SUBMITTED]: [CredentialStatus.UNDER_REVIEW],
  [CredentialStatus.UNDER_REVIEW]: [CredentialStatus.APPROVED, CredentialStatus.REJECTED],
  [CredentialStatus.APPROVED]: [CredentialStatus.PRINTED],
  [CredentialStatus.REJECTED]: [CredentialStatus.SUBMITTED],
  [CredentialStatus.PRINTED]: [CredentialStatus.ISSUED],
  [CredentialStatus.ISSUED]: [CredentialStatus.RETURNED, CredentialStatus.EXPIRED],
  [CredentialStatus.RETURNED]: [CredentialStatus.EXPIRED],
  [CredentialStatus.EXPIRED]: [],
};
