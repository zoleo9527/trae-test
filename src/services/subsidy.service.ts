import { calculateSubsidyAmount, getSubsidiesByOrder, getSubsidyById, mockSubsidies } from '@/mock/subsidies';
import type { Subsidy, SubsidyStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function getAllSubsidies(): Subsidy[] {
  return mockSubsidies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSubsidies(options?: {
  status?: SubsidyStatus;
  orderId?: string;
}): Subsidy[] {
  let subsidies = [...mockSubsidies];

  if (options?.status) {
    subsidies = subsidies.filter(s => s.status === options.status);
  }
  if (options?.orderId) {
    subsidies = subsidies.filter(s => s.orderId === options.orderId);
  }

  return subsidies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSubsidyDetail(id: string): Subsidy | undefined {
  return getSubsidyById(id);
}

export function createSubsidy(data: {
  orderId: string;
  riderName: string;
  type: string;
  reason: string;
  notes: string;
  amount?: number;
}): Subsidy {
  const amount = data.amount ?? calculateSubsidyAmount(data.orderId, data.reason);
  const subsidy: Subsidy = {
    id: `subsidy-${uuidv4().slice(0, 8)}`,
    orderId: data.orderId,
    riderName: data.riderName,
    type: data.type,
    reason: data.reason,
    notes: data.notes,
    amount,
    status: 'pending',
    approvedBy: null,
    createdAt: new Date().toISOString(),
    approvedAt: null,
  };
  mockSubsidies.push(subsidy);
  return subsidy;
}

export function updateSubsidyStatus(
  subsidyId: string,
  status: SubsidyStatus,
  approvedBy?: string
): Subsidy | undefined {
  const subsidy = getSubsidyById(subsidyId);
  if (subsidy) {
    subsidy.status = status;
    if (status === 'approved' || status === 'rejected') {
      subsidy.approvedBy = approvedBy || null;
      subsidy.approvedAt = new Date().toISOString();
    }
  }
  return subsidy;
}

export function getPendingCount(): number {
  return getPendingSubsidies().length;
}

export function calculateAmount(orderId: string, reason: string): number {
  return calculateSubsidyAmount(orderId, reason);
}

export function getSubsidiesByOrderId(orderId: string): Subsidy[] {
  return getSubsidiesByOrder(orderId);
}

export function getPendingSubsidies(): Subsidy[] {
  return mockSubsidies.filter(s => s.status === 'pending');
}

export function getSubsidyStatusLabel(status: SubsidyStatus): string {
  const labels: Record<SubsidyStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };
  return labels[status] || status;
}

export function getSubsidyStatusVariant(status: SubsidyStatus): 'default' | 'success' | 'warning' | 'danger' {
  const variants: Record<SubsidyStatus, 'default' | 'success' | 'warning' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return variants[status];
}
