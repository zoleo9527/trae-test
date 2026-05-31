import React from 'react';
import {
  ShippingStatus,
  ReceiptStatus,
  ReworkStatus,
  DisputeStatus,
  AlertPriority,
  ShippingStatusLabels,
  ReceiptStatusLabels,
  ReworkStatusLabels,
  DisputeStatusLabels,
  AlertPriorityLabels,
} from '@/types';

type StatusType = ShippingStatus | ReceiptStatus | ReworkStatus | DisputeStatus | AlertPriority;

interface StatusBadgeProps {
  status: StatusType;
  type: 'shipping' | 'receipt' | 'rework' | 'dispute' | 'priority';
}

const shippingStatusColors: Record<ShippingStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-warning-100 text-warning-700',
  approved: 'bg-success-100 text-success-700',
  shipped: 'bg-primary-100 text-primary-700',
  received: 'bg-blue-100 text-blue-700',
  completed: 'bg-success-100 text-success-700',
  rejected: 'bg-danger-100 text-danger-700',
};

const receiptStatusColors: Record<ReceiptStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  signed: 'bg-blue-100 text-blue-700',
  has_difference: 'bg-warning-100 text-warning-700',
  verified: 'bg-success-100 text-success-700',
  disputed: 'bg-danger-100 text-danger-700',
};

const reworkStatusColors: Record<ReworkStatus, string> = {
  created: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-primary-100 text-primary-700',
  submitted: 'bg-warning-100 text-warning-700',
  passed: 'bg-success-100 text-success-700',
  failed: 'bg-danger-100 text-danger-700',
  closed: 'bg-gray-100 text-gray-700',
};

const disputeStatusColors: Record<DisputeStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  negotiating: 'bg-warning-100 text-warning-700',
  ruled: 'bg-blue-100 text-blue-700',
  resolved: 'bg-success-100 text-success-700',
  appealed: 'bg-danger-100 text-danger-700',
};

const priorityColors: Record<AlertPriority, string> = {
  high: 'bg-danger-100 text-danger-700',
  medium: 'bg-warning-100 text-warning-700',
  low: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let label: string;
  let colorClass: string;

  switch (type) {
    case 'shipping':
      label = ShippingStatusLabels[status as ShippingStatus];
      colorClass = shippingStatusColors[status as ShippingStatus];
      break;
    case 'receipt':
      label = ReceiptStatusLabels[status as ReceiptStatus];
      colorClass = receiptStatusColors[status as ReceiptStatus];
      break;
    case 'rework':
      label = ReworkStatusLabels[status as ReworkStatus];
      colorClass = reworkStatusColors[status as ReworkStatus];
      break;
    case 'dispute':
      label = DisputeStatusLabels[status as DisputeStatus];
      colorClass = disputeStatusColors[status as DisputeStatus];
      break;
    case 'priority':
      label = AlertPriorityLabels[status as AlertPriority];
      colorClass = priorityColors[status as AlertPriority];
      break;
    default:
      label = String(status);
      colorClass = 'bg-gray-100 text-gray-700';
  }

  return (
    <span className={`status-badge ${colorClass}`}>
      {label}
    </span>
  );
}
