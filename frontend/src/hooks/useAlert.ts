import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { markAlertRead, markAlertHandled } from '@/store/actions';
import { useRole } from './useRole';

export function useAlert() {
  const { state, dispatch } = useApp();
  const { canViewAllData, currentRole } = useRole();

  const alerts = useMemo(() => {
    if (canViewAllData) {
      return state.alerts;
    }
    if (currentRole === 'team_leader') {
      return state.alerts.filter((a) => a.targetType !== 'dispute' && a.targetType !== 'settlement');
    }
    return state.alerts;
  }, [state.alerts, canViewAllData, currentRole]);

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
