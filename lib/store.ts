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
  addHistoryRemark: (remark: Omit<HistoryRemark, "id" | "createdAt">) => void;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => void;
  updateWorkOrderStatus: (
    workOrderId: string,
    status: WorkOrderStatus,
    operatorId: string,
    remark: string
  ) => void;
  addWorkOrderAttachment: (
    workOrderId: string,
    attachment: WorkOrder["attachments"][0]
  ) => void;
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
}));
