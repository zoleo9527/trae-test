import type {
  User,
  Project,
  ShippingOrder,
  Receipt,
  ReworkOrder,
  SettlementDispute,
  Alert,
  ActionLog,
  DashboardStats,
} from './index';

export interface AppState {
  currentUser: User | null;
  currentProject: Project | null;
  projects: Project[];
  shippingOrders: ShippingOrder[];
  receipts: Receipt[];
  reworkOrders: ReworkOrder[];
  disputes: SettlementDispute[];
  alerts: Alert[];
  actionLogs: ActionLog[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

export type ActionType =
  | 'SET_CURRENT_USER'
  | 'SET_CURRENT_PROJECT'
  | 'SET_PROJECTS'
  | 'SET_SHIPPING_ORDERS'
  | 'UPDATE_SHIPPING_ORDER'
  | 'ADD_SHIPPING_ORDER'
  | 'SET_RECEIPTS'
  | 'UPDATE_RECEIPT'
  | 'SET_REWORK_ORDERS'
  | 'UPDATE_REWORK_ORDER'
  | 'ADD_REWORK_ORDER'
  | 'SET_DISPUTES'
  | 'UPDATE_DISPUTE'
  | 'SET_ALERTS'
  | 'MARK_ALERT_READ'
  | 'MARK_ALERT_HANDLED'
  | 'SET_ACTION_LOGS'
  | 'ADD_ACTION_LOG'
  | 'SET_DASHBOARD_STATS'
  | 'SET_LOADING'
  | 'SET_ERROR';

export interface AppAction {
  type: ActionType;
  payload?: any;
}

export interface PermissionConfig {
  canCreateShipping: boolean;
  canApproveShipping: boolean;
  canShip: boolean;
  canSignReceipt: boolean;
  canVerifyReceipt: boolean;
  canRecordDifference: boolean;
  canJudgeResponsibility: boolean;
  canCreateRework: boolean;
  canExecuteRework: boolean;
  canReviewRework: boolean;
  canRuleDispute: boolean;
  canViewAllData: boolean;
}
