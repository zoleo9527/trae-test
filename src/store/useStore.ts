import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addHours } from 'date-fns';
import type {
  User,
  WorkOrder,
  WorkOrderLog,
  Alarm,
  SparePartRequest,
  WorkOrderStatus,
  SparePartStatus,
  DashboardStats,
  WorkOrderPriority,
} from '../types';
import {
  mockUsers,
  mockWorkOrders,
  mockWorkOrderLogs,
  mockAlarms,
  mockSparePartRequests,
} from '../data/mockData';

interface CreateWorkOrderData {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  assigneeId: string;
  alarmId?: string;
  deadlineHours?: number;
}

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
  createWorkOrder: (data: CreateWorkOrderData) => string;
  assignWorkOrder: (id: string, assigneeId: string, remark: string) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus, remark: string) => void;
  addWorkOrderLog: (workorderId: string, action: string, remark: string) => void;
  requestSparePart: (workorderId: string, partName: string, partCode: string, quantity: number, unit: string) => void;
  approveSparePart: (sparePartId: string, remark: string) => void;
  rejectSparePart: (sparePartId: string, remark: string) => void;
  issueSparePart: (sparePartId: string, remark: string) => void;
  returnSparePart: (sparePartId: string, remark: string) => void;
  updateAlarmStatus: (alarmId: string, status: 'active' | 'acknowledged' | 'resolved', workorderId?: string) => void;
  toggleSidebar: () => void;
  getWorkOrderLogs: (workorderId: string) => WorkOrderLog[];
  getWorkOrderAlarms: (workorderId: string) => Alarm[];
  getWorkOrderSpareParts: (workorderId: string) => SparePartRequest[];
  getDashboardStats: () => DashboardStats;
  getUserName: (userId: string) => string;
  getUsers: () => User[];
  getEngineers: () => User[];
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

      createWorkOrder: (data: CreateWorkOrderData) => {
        const { currentUser, addWorkOrderLog, updateAlarmStatus } = get();
        if (!currentUser) return '';

        const now = new Date();
        const deadline = data.deadlineHours ? addHours(now, data.deadlineHours) : addHours(now, 24);

        const newWorkOrder: WorkOrder = {
          id: `wo-${Date.now()}`,
          title: data.title,
          description: data.description,
          status: 'pending',
          priority: data.priority,
          station: '阳光光伏电站A站',
          assigneeId: data.assigneeId,
          alarmId: data.alarmId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          deadline: deadline.toISOString(),
          downtimeHours: 0,
          photos: [],
        };

        set((state) => ({
          workOrders: [...state.workOrders, newWorkOrder],
        }));

        addWorkOrderLog(newWorkOrder.id, 'create', `创建工单: ${data.title}`);

        if (data.assigneeId) {
          addWorkOrderLog(newWorkOrder.id, 'assign', `分派给 ${get().getUserName(data.assigneeId)}`);
        }

        if (data.alarmId) {
          updateAlarmStatus(data.alarmId, 'acknowledged', newWorkOrder.id);
          addWorkOrderLog(newWorkOrder.id, 'link_alarm', `关联发电预警: ${data.alarmId}`);
        }

        return newWorkOrder.id;
      },

      assignWorkOrder: (id: string, assigneeId: string, remark: string) => {
        const { addWorkOrderLog, getUserName } = get();

        set((state) => ({
          workOrders: state.workOrders.map((wo) =>
            wo.id === id
              ? { ...wo, assigneeId, updatedAt: new Date().toISOString() }
              : wo
          ),
        }));

        addWorkOrderLog(id, 'assign', remark || `分派给 ${getUserName(assigneeId)}`);
      },

      updateWorkOrderStatus: (id: string, status: WorkOrderStatus, remark: string) => {
        const { currentUser, addWorkOrderLog, getWorkOrderAlarms, updateAlarmStatus } = get();
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

        if (status === 'closed') {
          const alarms = getWorkOrderAlarms(id);
          alarms.forEach((alarm) => {
            updateAlarmStatus(alarm.id, 'resolved');
          });
        }
      },

      addWorkOrderLog: (workorderId: string, action: string, remark: string) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newLog: WorkOrderLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        const { currentUser, addWorkOrderLog, updateWorkOrderStatus } = get();
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

        updateWorkOrderStatus(workorderId, 'waiting_spare', `申请备件: ${partName} x${quantity}${unit}`);
      },

      approveSparePart: (sparePartId: string, remark: string) => {
        const { currentUser, spareParts, addWorkOrderLog, updateWorkOrderStatus } = get();
        if (!currentUser) return;

        const sparePart = spareParts.find((sp) => sp.id === sparePartId);
        if (!sparePart) return;

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

        addWorkOrderLog(sparePart.workorderId, 'approve_spare', `备件申请已批准: ${sparePart.partName} - ${remark}`);
        updateWorkOrderStatus(sparePart.workorderId, 'processing', `备件已批准，继续处理: ${remark}`);
      },

      rejectSparePart: (sparePartId: string, remark: string) => {
        const { currentUser, spareParts, addWorkOrderLog, updateWorkOrderStatus } = get();
        if (!currentUser) return;

        const sparePart = spareParts.find((sp) => sp.id === sparePartId);
        if (!sparePart) return;

        set((state) => ({
          spareParts: state.spareParts.map((sp) =>
            sp.id === sparePartId
              ? {
                  ...sp,
                  status: 'rejected' as SparePartStatus,
                  approvedAt: new Date().toISOString(),
                  approverId: currentUser.id,
                }
              : sp
          ),
        }));

        addWorkOrderLog(sparePart.workorderId, 'reject_spare', `备件申请被拒绝: ${sparePart.partName} - ${remark}`);
        updateWorkOrderStatus(sparePart.workorderId, 'processing', `备件申请被拒绝，需重新评估: ${remark}`);
      },

      issueSparePart: (sparePartId: string, remark: string) => {
        const { currentUser, spareParts, addWorkOrderLog } = get();
        if (!currentUser) return;

        const sparePart = spareParts.find((sp) => sp.id === sparePartId);
        if (!sparePart) return;

        set((state) => ({
          spareParts: state.spareParts.map((sp) =>
            sp.id === sparePartId
              ? {
                  ...sp,
                  status: 'issued' as SparePartStatus,
                  issuedAt: new Date().toISOString(),
                  issuerId: currentUser.id,
                  issueRemark: remark,
                }
              : sp
          ),
        }));

        addWorkOrderLog(sparePart.workorderId, 'issue_spare', `备件已发放: ${sparePart.partName} x${sparePart.quantity}${sparePart.unit} - ${remark}`);
      },

      returnSparePart: (sparePartId: string, remark: string) => {
        const { currentUser, spareParts, addWorkOrderLog } = get();
        if (!currentUser) return;

        const sparePart = spareParts.find((sp) => sp.id === sparePartId);
        if (!sparePart) return;

        set((state) => ({
          spareParts: state.spareParts.map((sp) =>
            sp.id === sparePartId
              ? {
                  ...sp,
                  status: 'returned' as SparePartStatus,
                  returnedAt: new Date().toISOString(),
                  returnerId: currentUser.id,
                  returnRemark: remark,
                }
              : sp
          ),
        }));

        addWorkOrderLog(sparePart.workorderId, 'return_spare', `备件已归还: ${sparePart.partName} x${sparePart.quantity}${sparePart.unit} - ${remark}`);
      },

      updateAlarmStatus: (alarmId: string, status: 'active' | 'acknowledged' | 'resolved', workorderId?: string) => {
        set((state) => ({
          alarms: state.alarms.map((alarm) =>
            alarm.id === alarmId
              ? { ...alarm, status, workorderId: workorderId || alarm.workorderId }
              : alarm
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
        const { workOrders, alarms, spareParts } = get();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        return {
          totalWorkOrders: workOrders.length,
          pendingWorkOrders: workOrders.filter((wo) => wo.status === 'pending' || wo.status === 'processing' || wo.status === 'returned').length,
          activeAlarms: alarms.filter((a) => a.status === 'active' || a.status === 'acknowledged').length,
          criticalAlarms: alarms.filter((a) => a.level === 'critical' && a.status !== 'resolved').length,
          totalDowntime: workOrders.reduce((sum, wo) => sum + wo.downtimeHours, 0),
          completionRate: Math.round(
            workOrders.length > 0
              ? (workOrders.filter((wo) => wo.status === 'closed').length / workOrders.length) * 100
              : 0
          ),
          todayNewWorkOrders: workOrders.filter((wo) => wo.createdAt.split('T')[0] === today).length,
          overdueWorkOrders: workOrders.filter(
            (wo) => new Date(wo.deadline) < now && wo.status !== 'closed'
          ).length,
          pendingSpareParts: spareParts.filter((sp) => sp.status === 'pending').length,
        } as DashboardStats & { pendingSpareParts: number };
      },

      getUserName: (userId: string) => {
        const user = mockUsers.find((u) => u.id === userId);
        return user?.name || '未知用户';
      },

      getUsers: () => {
        return mockUsers;
      },

      getEngineers: () => {
        return mockUsers.filter((u) => u.role === 'engineer');
      },
    }),
    {
      name: 'pv-ops-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        workOrders: state.workOrders,
        workOrderLogs: state.workOrderLogs,
        spareParts: state.spareParts,
        alarms: state.alarms,
      }),
    }
  )
);
