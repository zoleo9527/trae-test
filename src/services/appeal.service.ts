import { getAppealById, getAppealsByOrder, mockAppeals } from '@/mock/appeals';
import type { Appeal, AppealStatus, ResponsibleParty, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';
export { getAppealStatusLabel, getAppealStatusVariant } from '@/utils/labels';

export function getAllAppeals(): Appeal[] {
  return mockAppeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAppeals(options?: {
  status?: AppealStatus;
  orderId?: string;
  handlerRole?: UserRole;
}): Appeal[] {
  let appeals = [...mockAppeals];

  if (options?.status) {
    appeals = appeals.filter(a => a.status === options.status);
  }
  if (options?.orderId) {
    appeals = appeals.filter(a => a.orderId === options.orderId);
  }
  if (options?.handlerRole) {
    appeals = appeals.filter(a => a.handlerRole === options.handlerRole);
  }

  return appeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAppealDetail(id: string): Appeal | undefined {
  return getAppealById(id);
}

export function createAppeal(data: Omit<Appeal, 'id' | 'createdAt' | 'status' | 'handlerRole' | 'handlerName' | 'resolvedAt' | 'resolution'>): Appeal {
  const appeal: Appeal = {
    ...data,
    id: `appeal-${uuidv4().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    handlerRole: null,
    handlerName: null,
    resolvedAt: null,
    resolution: null,
  };
  mockAppeals.push(appeal);
  return appeal;
}

export function updateAppealStatus(
  appealId: string,
  status: AppealStatus,
  options?: {
    handlerRole?: UserRole;
    handlerName?: string;
    resolution?: string;
    responsibleParty?: ResponsibleParty;
  }
): Appeal | undefined {
  const appeal = getAppealById(appealId);
  if (appeal) {
    appeal.status = status;
    if (options?.handlerRole) appeal.handlerRole = options.handlerRole;
    if (options?.handlerName) appeal.handlerName = options.handlerName;
    if (options?.resolution) appeal.resolution = options.resolution;
    if (options?.responsibleParty) appeal.responsibleParty = options.responsibleParty;
    if (status === 'resolved' || status === 'rejected') {
      appeal.resolvedAt = new Date().toISOString();
    }
  }
  return appeal;
}

export function assignAppealHandler(
  appealId: string,
  handlerRole: UserRole,
  handlerName: string
): Appeal | undefined {
  const appeal = getAppealById(appealId);
  if (appeal) {
    appeal.handlerRole = handlerRole;
    appeal.handlerName = handlerName;
    appeal.status = 'processing';
  }
  return appeal;
}

export function getPendingCount(): number {
  return getPendingAppeals().length;
}

export function getAppealsByOrderId(orderId: string): Appeal[] {
  return getAppealsByOrder(orderId);
}

export function getPendingAppeals(): Appeal[] {
  return mockAppeals.filter(a => a.status === 'pending' || a.status === 'processing');
}
