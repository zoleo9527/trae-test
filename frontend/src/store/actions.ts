import type { AppAction } from '@/types/state';
import type {
  User, Project, ShippingOrder, Receipt, ReworkOrder, SettlementDispute, Alert, ActionLog, DashboardStats } from '@/types';

export const setCurrentUser = (user: User | null): AppAction => ({
  type: 'SET_CURRENT_USER',
  payload: user,
});

export const setCurrentProject = (project: Project | null): AppAction => ({
  type: 'SET_CURRENT_PROJECT',
  payload: project,
});

export const setProjects = (projects: Project[]): AppAction => ({
  type: 'SET_PROJECTS',
  payload: projects,
});

export const setShippingOrders = (orders: ShippingOrder[]): AppAction => ({
  type: 'SET_SHIPPING_ORDERS',
  payload: orders,
});

export const updateShippingOrder = (order: ShippingOrder): AppAction => ({
  type: 'UPDATE_SHIPPING_ORDER',
  payload: order,
});

export const addShippingOrder = (order: ShippingOrder): AppAction => ({
  type: 'ADD_SHIPPING_ORDER',
  payload: order,
});

export const setReceipts = (receipts: Receipt[]): AppAction => ({
  type: 'SET_RECEIPTS',
  payload: receipts,
});

export const updateReceipt = (receipt: Receipt): AppAction => ({
  type: 'UPDATE_RECEIPT',
  payload: receipt,
});

export const setReworkOrders = (orders: ReworkOrder[]): AppAction => ({
  type: 'SET_REWORK_ORDERS',
  payload: orders,
});

export const updateReworkOrder = (order: ReworkOrder): AppAction => ({
  type: 'UPDATE_REWORK_ORDER',
  payload: order,
});

export const addReworkOrder = (order: ReworkOrder): AppAction => ({
  type: 'ADD_REWORK_ORDER',
  payload: order,
});

export const setDisputes = (disputes: SettlementDispute[]): AppAction => ({
  type: 'SET_DISPUTES',
  payload: disputes,
});

export const updateDispute = (dispute: SettlementDispute): AppAction => ({
  type: 'UPDATE_DISPUTE',
  payload: dispute,
});

export const setAlerts = (alerts: Alert[]): AppAction => ({
  type: 'SET_ALERTS',
  payload: alerts,
});

export const markAlertRead = (alertId: string): AppAction => ({
  type: 'MARK_ALERT_READ',
  payload: alertId,
});

export const markAlertHandled = (alertId: string): AppAction => ({
  type: 'MARK_ALERT_HANDLED',
  payload: alertId,
});

export const setActionLogs = (logs: ActionLog[]): AppAction => ({
  type: 'SET_ACTION_LOGS',
  payload: logs,
});

export const addActionLog = (log: ActionLog): AppAction => ({
  type: 'ADD_ACTION_LOG',
  payload: log,
});

export const setDashboardStats = (stats: DashboardStats): AppAction => ({
  type: 'SET_DASHBOARD_STATS',
  payload: stats,
});

export const setLoading = (loading: boolean): AppAction => ({
  type: 'SET_LOADING',
  payload: loading,
});

export const setError = (error: string | null): AppAction => ({
  type: 'SET_ERROR',
  payload: error,
});
