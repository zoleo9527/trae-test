import { useApp } from '@/store/AppContext';
import { markAlertRead, markAlertHandled } from '@/store/actions';

export function useAlert() {
  const { state, dispatch } = useApp();
  const alerts = state.alerts;

  const unreadCount = alerts.filter(a => !a.read).length;
  const unhandledCount = alerts.filter(a => !a.handled).length;
  const highPriorityAlerts = alerts.filter(a => a.priority === 'high' && !a.handled);

  const markAsRead = (alertId: string) => {
    dispatch(markAlertRead(alertId));
  };

  const markAsHandled = (alertId: string) => {
    dispatch(markAlertHandled(alertId));
  };

  const markAllAsRead = () => {
    alerts.forEach(alert => {
      if (!alert.read) return;
      dispatch(markAlertRead(alert.id));
    });
  };

  return {
    alerts,
    unreadCount,
    unhandledCount,
    highPriorityAlerts,
    markAsRead,
    markAsHandled,
    markAllAsRead,
  };
}
