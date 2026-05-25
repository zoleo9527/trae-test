import { v4 as uuidv4 } from 'uuid';

export const ROLES = {
  THEATER_MANAGER: 'theater_manager',
  TICKET_SUPERVISOR: 'ticket_supervisor',
  BACKEND_COORDINATOR: 'backend_coordinator'
};

export const PERFORMANCE_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  TICKETING: 'ticketing',
  REHEARSING: 'rehearsing',
  PERFORMING: 'performing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  PARTIAL_REFUND: 'partial_refund',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

export const REHEARSAL_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled'
};

export const TASK_TYPE = {
  SCHEDULE_APPROVAL: 'schedule_approval',
  TICKET_GROUP: 'ticket_group',
  REFUND_REQUEST: 'refund_request',
  REHEARSAL_ARRANGEMENT: 'rehearsal_arrangement',
  SCHEDULE_CHANGE: 'schedule_change',
  SETTLEMENT: 'settlement'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed'
};
