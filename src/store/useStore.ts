import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  WorkOrder,
  WorkOrderLog,
  Alarm,
  SparePartRequest,
  WorkOrderStatus,
  SparePartStatus,
  DashboardStats,
} from '../types';
import {
  mockUsers,
  mockWorkOrders,
  mockWorkOrderLogs,
  mockAlarms,
  mockSparePartRequests,
} from '../data/mockData';

interface AppState {
  currentUser: User | null;
  workOrders: WorkOrder[];
  workOrderLogs: WorkOrderLog[];
  alarms: Alarm[];
  spareParts: SparePartRequest[];
  selectedWorkOrderId: string | null;
  sidebarOpen: boolean;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  selectWorkOrder: (id: string | null) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus, remark: string) => void;
  addWorkOrderLog: (workorderId: string, action: string, remark: string) => void;
  requestSparePart: (workorderId: string, partName: string, partCode: string, quantity: number, unit: string) => void;
  approveSparePart: (sparePartId: string) => void;
  toggleSidebar: () => void;
  getWorkOrderLogs: (workorderId: string) => WorkOrderLog[];
  getWorkOrderAlarms: (workorderId: string) => Alarm[];
  getWorkOrderSpareParts: (workorderId: string) => SparePartRequest[];
  getDashboardStats: () => DashboardStats;
  getUserName: (userId: string) => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      workOrders: mockWorkOrders,
      workOrderLogs: mockWorkOrderLogs,
      alarms: mockAlarms,
      spareParts: mockSparePartRequests,
      selectedWorkOrderId: null,
      sidebarOpen: false,

      login: (username: string, password: string) => {
        const user = mockUsers.find(
          (u) => u.username === username && u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null, selectedWorkOrderId: null });
      },

      selectWorkOrder: (id: string | null) => {
        set({ selectedWorkOrderId: id, sidebarOpen: id !== null });
      },

      updateWorkOrderStatus: (id: string, status: WorkOrderStatus, remark: string) => {
        const { currentUser, addWorkOrderLog } = get();
        if (!currentUser) return;

        set((state) => ({
          workOrders: state.workOrders.map((wo) =>
            wo.id === id
              ? { ...wo, status, updatedAt: new Date().toISOString() }
              : wo
          ),
        }));

        const actionMap: Record<string, string> = {
          pending: 'reopen',
          processing: 'start',
          waiting_spare: 'request_spare',
          reviewing: 'complete',
          returned: 'reject',
          closed: 'close',
        };

        addWorkOrderLog(id, actionMap[status] || 'update', remark);
      },

      addWorkOrderLog: (workorderId: string, action: string, remark: string) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newLog: WorkOrderLog = {
          id: `log-${Date.now()}`,
          workorderId,
          action,
          operatorId: currentUser.id,
          remark,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          workOrderLogs: [...state.workOrderLogs, newLog],
        }));
      },

      requestSparePart: (workorderId: string, partName: string, partCode: string, quantity: number, unit: string) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newSparePart: SparePartRequest = {
          id: `sp-${Date.now()}`,
          workorderId,
          requesterId: currentUser.id,
          partName,
          partCode,
          quantity,
          unit,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          spareParts: [...state.spareParts, newSparePart],
        }));

        get().addWorkOrderLog(workorderId, 'request_spare', `申请备件: ${partName} x${quantity}${unit}`);
      },

      approveSparePart: (sparePartId: string) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set((state) => ({
          spareParts: state.spareParts.map((sp) =>
            sp.id === sparePartId
              ? {
                  ...sp,
                  status: 'approved' as SparePartStatus,
                  approvedAt: new Date().toISOString(),
                  approverId: currentUser.id,
                }
              : sp
          ),
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      getWorkOrderLogs: (workorderId: string) => {
        return get()
          .workOrderLogs.filter((log) => log.workorderId === workorderId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getWorkOrderAlarms: (workorderId: string) => {
        return get().alarms.filter((alarm) => alarm.workorderId === workorderId);
      },

      getWorkOrderSpareParts: (workorderId: string) => {
        return get().spareParts.filter((sp) => sp.workorderId === workorderId);
      },

      getDashboardStats: () => {
        const { workOrders, alarms } = get();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        return {
          totalWorkOrders: workOrders.length,
          pendingWorkOrders: workOrders.filter((wo) => wo.status === 'pending' || wo.status === 'processing').length,
          activeAlarms: alarms.filter((a) => a.status === 'active' || a.status === 'acknowledged').length,
          criticalAlarms: alarms.filter((a) => a.level === 'critical' && a.status !== 'resolved').length,
          totalDowntime: workOrders.reduce((sum, wo) => sum + wo.downtimeHours, 0),
          completionRate: Math.round(
            (workOrders.filter((wo) => wo.status === 'closed').length / workOrders.length) * 100
          ),
          todayNewWorkOrders: workOrders.filter((wo) => wo.createdAt.split('T')[0] === today).length,
          overdueWorkOrders: workOrders.filter(
            (wo) => new Date(wo.deadline) < now && wo.status !== 'closed'
          ).length,
        };
      },

      getUserName: (userId: string) => {
        const user = mockUsers.find((u) => u.id === userId);
        return user?.name || '未知用户';
      },
    }),
    {
      name: 'pv-ops-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        workOrders: state.workOrders,
        workOrderLogs: state.workOrderLogs,
        spareParts: state.spareParts,
      }),
    }
  )
);
