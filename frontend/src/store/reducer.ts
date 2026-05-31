import type { AppState, AppAction } from '@/types/state';

export const initialState: AppState = {
  currentUser: null,
  currentProject: null,
  projects: [],
  shippingOrders: [],
  receipts: [],
  reworkOrders: [],
  disputes: [],
  alerts: [],
  actionLogs: [],
  dashboardStats: null,
  loading: false,
  error: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };

    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };

    case 'SET_SHIPPING_ORDERS':
      return { ...state, shippingOrders: action.payload };

    case 'UPDATE_SHIPPING_ORDER':
      return {
        ...state,
        shippingOrders: state.shippingOrders.map((order) =>
          order.id === action.payload.id ? action.payload : order
        ),
      };

    case 'ADD_SHIPPING_ORDER':
      return {
        ...state,
        shippingOrders: [action.payload, ...state.shippingOrders],
      };

    case 'SET_RECEIPTS':
      return { ...state, receipts: action.payload };

    case 'UPDATE_RECEIPT':
      return {
        ...state,
        receipts: state.receipts.map((receipt) =>
          receipt.id === action.payload.id ? action.payload : receipt
        ),
      };

    case 'SET_REWORK_ORDERS':
      return { ...state, reworkOrders: action.payload };

    case 'UPDATE_REWORK_ORDER':
      return {
        ...state,
        reworkOrders: state.reworkOrders.map((order) =>
          order.id === action.payload.id ? action.payload : order
        ),
      };

    case 'ADD_REWORK_ORDER':
      return {
        ...state,
        reworkOrders: [action.payload, ...state.reworkOrders],
      };

    case 'SET_DISPUTES':
      return { ...state, disputes: action.payload };

    case 'UPDATE_DISPUTE':
      return {
        ...state,
        disputes: state.disputes.map((dispute) =>
          dispute.id === action.payload.id ? action.payload : dispute
        ),
      };

    case 'ADD_DISPUTE':
      return {
        ...state,
        disputes: [action.payload, ...state.disputes],
      };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.id === action.payload ? { ...alert, read: true } : alert
        ),
      };

    case 'MARK_ALERT_HANDLED':
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.id === action.payload
            ? { ...alert, handled: true, handledAt: new Date().toISOString() }
            : alert
        ),
      };

    case 'SET_ACTION_LOGS':
      return { ...state, actionLogs: action.payload };

    case 'ADD_ACTION_LOG':
      return {
        ...state,
        actionLogs: [action.payload, ...state.actionLogs],
      };

    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}
