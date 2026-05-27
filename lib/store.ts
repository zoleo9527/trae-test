import { create } from "zustand";
import {
    mockDevices,
    mockHistoryRemarks,
    mockMaterials,
    mockRefundRequests,
    mockScheduleItems,
    mockStationMaterials,
    mockStations,
    mockUsers,
    mockWorkOrders,
} from "./mockData";
import type {
    HistoryRemark,
    RefundRequest,
    Role,
    ScheduleItem,
    User,
    WorkOrder,
    WorkOrderHistoryItem,
    WorkOrderStatus,
} from "./types";

interface AppState {
  currentUser: User;
  workOrders: WorkOrder[];
  scheduleItems: ScheduleItem[];
  historyRemarks: HistoryRemark[];
  refundRequests: RefundRequest[];
  stations: typeof mockStations;
  devices: typeof mockDevices;
  materials: typeof mockMaterials;
  stationMaterials: typeof mockStationMaterials;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: Role) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  addWorkOrder: (workOrder: Omit<WorkOrder, "id" | "createdAt" | "updatedAt" | "history">) => void;
  addHistoryRemark: (remark: Omit<HistoryRemark, "id" | "createdAt">) => void;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => void;
  addScheduleItem: (item: Omit<ScheduleItem, "id">) => void;
  updateWorkOrderStatus: (
    workOrderId: string,
    status: WorkOrderStatus,
    operatorId: string,
    remark: string
  ) => void;
  assignWorkOrder: (workOrderId: string, assigneeId: string, operatorId: string) => void;
  addWorkOrderAttachment: (
    workOrderId: string,
    attachment: WorkOrder["attachments"][0]
  ) => void;
  updateRefundRequest: (id: string, updates: Partial<RefundRequest>) => void;
  updateStationMaterial: (stationId: string, materialId: string, updates: Partial<typeof mockStationMaterials[0]>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: mockUsers[0],
  workOrders: mockWorkOrders,
  scheduleItems: mockScheduleItems,
  historyRemarks: mockHistoryRemarks,
  refundRequests: mockRefundRequests,
  stations: mockStations,
  devices: mockDevices,
  materials: mockMaterials,
  stationMaterials: mockStationMaterials,
  users: mockUsers,

  setCurrentUser: (user) => set({ currentUser: user }),

  switchRole: (role) =>
    set((state) => {
      const user = mockUsers.find((u) => u.role === role);
      return { currentUser: user || state.currentUser };
    }),

  updateWorkOrder: (id, updates) =>
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, ...updates, updatedAt: new Date().toISOString() } : wo
      ),
    })),

  addHistoryRemark: (remark) =>
    set((state) => ({
      historyRemarks: [
        ...state.historyRemarks,
        {
          ...remark,
          id: `hr${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  updateScheduleItem: (id, updates) =>
    set((state) => ({
      scheduleItems: state.scheduleItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  updateWorkOrderStatus: (workOrderId, status, operatorId, remark) =>
    set((state) => ({
      workOrders: state.workOrders.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        const historyItem: WorkOrderHistoryItem = {
          status,
          operatorId,
          timestamp: new Date().toISOString(),
          remark,
        };
        return {
          ...wo,
          status,
          updatedAt: new Date().toISOString(),
          history: [...wo.history, historyItem],
        };
      }),
    })),

  addWorkOrderAttachment: (workOrderId, attachment) =>
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId
          ? { ...wo, attachments: [...wo.attachments, attachment] }
          : wo
      ),
    })),

  addWorkOrder: (workOrder) =>
    set((state) => ({
      workOrders: [
        {
          ...workOrder,
          id: `wo${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [
            {
              status: workOrder.status || "pending",
              operatorId: workOrder.creatorId,
              timestamp: new Date().toISOString(),
              remark: "工单已创建",
            },
          ],
        },
        ...state.workOrders,
      ],
    })),

  assignWorkOrder: (workOrderId, assigneeId, operatorId) =>
    set((state) => ({
      workOrders: state.workOrders.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        const historyItem: WorkOrderHistoryItem = {
          status: "assigned",
          operatorId,
          timestamp: new Date().toISOString(),
          remark: `已派单给${state.users.find((u) => u.id === assigneeId)?.name || "未知"}`,
        };
        return {
          ...wo,
          assigneeId,
          status: "assigned",
          updatedAt: new Date().toISOString(),
          history: [...wo.history, historyItem],
        };
      }),
    })),

  updateRefundRequest: (id, updates) =>
    set((state) => ({
      refundRequests: state.refundRequests.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  addScheduleItem: (item) =>
    set((state) => ({
      scheduleItems: [
        ...state.scheduleItems,
        {
          ...item,
          id: `sch${Date.now()}`,
        },
      ],
    })),

  updateStationMaterial: (stationId, materialId, updates) =>
    set((state) => ({
      stationMaterials: state.stationMaterials.map((sm) =>
        sm.stationId === stationId && sm.materialId === materialId
          ? { ...sm, ...updates }
          : sm
      ),
    })),
}));
