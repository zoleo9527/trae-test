import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { useRole } from './useRole';
import type {
  ShippingOrder,
  Receipt,
  ReworkOrder,
  SettlementDispute,
  Alert,
  ActionLog,
} from '@/types';

export function useFilteredData() {
  const { state } = useApp();
  const { currentUser, currentRole, canViewAllData } = useRole();

  const filteredShippingOrders = useMemo(() => {
    if (canViewAllData) {
      return state.shippingOrders;
    }
    if (currentRole === 'team_leader') {
      return state.shippingOrders.filter((o) => ['shipped', 'signed', 'completed'].includes(o.status));
    }
    return state.shippingOrders;
  }, [state.shippingOrders, canViewAllData, currentRole]);

  const filteredReceipts = useMemo(() => {
    if (canViewAllData) {
      return state.receipts;
    }
    if (currentRole === 'team_leader') {
      return state.receipts.filter((r) => r.status === 'pending' || r.signedBy === currentUser?.id);
    }
    return state.receipts;
  }, [state.receipts, canViewAllData, currentRole, currentUser]);

  const filteredReworkOrders = useMemo(() => {
    if (canViewAllData) {
      return state.reworkOrders;
    }
    if (currentRole === 'team_leader') {
      return state.reworkOrders.filter((r) =>
        ['created', 'in_progress', 'submitted', 'failed'].includes(r.status) ||
        r.steps.some((s) => s.operator === currentUser?.id)
      );
    }
    return state.reworkOrders;
  }, [state.reworkOrders, canViewAllData, currentRole, currentUser]);

  const filteredDisputes = useMemo(() => {
    if (canViewAllData) {
      return state.disputes;
    }
    return [];
  }, [state.disputes, canViewAllData]);

  const filteredAlerts = useMemo(() => {
    if (canViewAllData) {
      return state.alerts;
    }
    if (currentRole === 'team_leader') {
      return state.alerts.filter((a) => a.targetType !== 'dispute' && a.targetType !== 'settlement');
    }
    return state.alerts;
  }, [state.alerts, canViewAllData, currentRole]);

  const filteredActionLogs = useMemo(() => {
    if (canViewAllData) {
      return state.actionLogs;
    }
    if (currentRole === 'team_leader') {
      return state.actionLogs.filter(
        (log) => log.operatorId === currentUser?.id ||
          ['shipping', 'receipt', 'rework'].includes(log.targetType)
      );
    }
    return state.actionLogs;
  }, [state.actionLogs, canViewAllData, currentRole, currentUser]);

  const dashboardStats = useMemo(() => {
    if (canViewAllData) {
      return state.dashboardStats;
    }
    const stats = {
      totalShipping: filteredShippingOrders.length,
      pendingApproval: filteredShippingOrders.filter((o) => o.status === 'pending_approval').length,
      totalReceipt: filteredReceipts.length,
      pendingSign: filteredReceipts.filter((r) => r.status === 'pending').length,
      totalRework: filteredReworkOrders.length,
      inProgressRework: filteredReworkOrders.filter((r) => ['in_progress', 'submitted', 'failed'].includes(r.status)).length,
      totalDispute: filteredDisputes.length,
      pendingDispute: filteredDisputes.filter((d) => d.status === 'negotiating').length,
    };
    return stats;
  }, [state.dashboardStats, canViewAllData, filteredShippingOrders, filteredReceipts, filteredReworkOrders, filteredDisputes]);

  return {
    shippingOrders: filteredShippingOrders,
    receipts: filteredReceipts,
    reworkOrders: filteredReworkOrders,
    disputes: filteredDisputes,
    alerts: filteredAlerts,
    actionLogs: filteredActionLogs,
    dashboardStats,
    canViewDisputes: canViewAllData,
  };
}
