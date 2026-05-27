import { create } from 'zustand'
import type { WorkOrder, WorkOrderStatus, WorkOrderLog } from '@/types'
import { mockWorkOrders } from '@/mock/workorders'
import { generateId } from '@/utils/format'

interface WorkOrderFilters {
  status?: WorkOrderStatus
  priority?: string
  type?: string
  siteId?: string
  keyword?: string
}

interface WorkOrderState {
  workOrders: WorkOrder[]
  loading: boolean
  _loaded: boolean
  selectedWorkOrder: WorkOrder | null
  fetchWorkOrders: (filters?: WorkOrderFilters) => Promise<void>
  getWorkOrder: (id: string) => WorkOrder | undefined
  setSelectedWorkOrder: (wo: WorkOrder | null) => void
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => Promise<void>
  createWorkOrder: (data: Omit<WorkOrder, 'id' | 'logs' | 'attachments' | 'createdAt'>) => Promise<WorkOrder>
  addLog: (workOrderId: string, log: Omit<WorkOrderLog, 'id' | 'workOrderId' | 'createdAt'>) => Promise<void>
  escalateWorkOrder: (id: string, reason: string, operatorId: string, operatorName: string) => Promise<void>
  returnWorkOrder: (id: string, reason: string, operatorId: string, operatorName: string) => Promise<void>
  completeWorkOrder: (id: string, remark: string, operatorId: string, operatorName: string) => Promise<void>
}

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  workOrders: [],
  loading: false,
  _loaded: false,
  selectedWorkOrder: null,
  fetchWorkOrders: async (filters) => {
    if (!get()._loaded) {
      set({ loading: true })
      await new Promise((r) => setTimeout(r, 200))
      set({ workOrders: mockWorkOrders, loading: false, _loaded: true })
    }
    if (filters) {
      let result = [...get().workOrders]
      if (filters.status) {
        result = result.filter((wo) => wo.status === filters.status)
      }
      if (filters.priority) {
        result = result.filter((wo) => wo.priority === filters.priority)
      }
      if (filters.type) {
        result = result.filter((wo) => wo.type === filters.type)
      }
      if (filters.siteId) {
        result = result.filter((wo) => wo.siteId === filters.siteId)
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        result = result.filter(
          (wo) =>
            wo.title.toLowerCase().includes(kw) ||
            wo.description.toLowerCase().includes(kw) ||
            wo.siteName.toLowerCase().includes(kw)
        )
      }
    }
  },
  getWorkOrder: (id) => {
    return get().workOrders.find((wo) => wo.id === id)
  },
  setSelectedWorkOrder: (wo) => {
    set({ selectedWorkOrder: wo })
  },
  updateWorkOrder: async (id, data) => {
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, ...data } : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === id
          ? { ...state.selectedWorkOrder, ...data }
          : state.selectedWorkOrder,
    }))
  },
  createWorkOrder: async (data) => {
    const newWo: WorkOrder = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      logs: [
        {
          id: generateId(),
          workOrderId: '',
          operatorId: data.reporterId,
          operatorName: data.reporterName,
          action: '创建工单',
          createdAt: new Date().toISOString(),
        },
      ],
      attachments: [],
    }
    newWo.logs[0].workOrderId = newWo.id
    set((state) => ({
      workOrders: [newWo, ...state.workOrders],
    }))
    return newWo
  },
  addLog: async (workOrderId, log) => {
    const newLog: WorkOrderLog = {
      ...log,
      id: generateId(),
      workOrderId,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId
          ? { ...wo, logs: [...wo.logs, newLog] }
          : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === workOrderId
          ? { ...state.selectedWorkOrder, logs: [...state.selectedWorkOrder.logs, newLog] }
          : state.selectedWorkOrder,
    }))
  },
  escalateWorkOrder: async (id, reason, operatorId, operatorName) => {
    await get().addLog(id, {
      operatorId,
      operatorName,
      action: '申请升级',
      remark: reason,
    })
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, status: 'escalated' } : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === id
          ? { ...state.selectedWorkOrder, status: 'escalated' }
          : state.selectedWorkOrder,
    }))
  },
  returnWorkOrder: async (id, reason, operatorId, operatorName) => {
    await get().addLog(id, {
      operatorId,
      operatorName,
      action: '退回工单',
      remark: reason,
    })
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, status: 'returned' } : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === id
          ? { ...state.selectedWorkOrder, status: 'returned' }
          : state.selectedWorkOrder,
    }))
  },
  completeWorkOrder: async (id, remark, operatorId, operatorName) => {
    await get().addLog(id, {
      operatorId,
      operatorName,
      action: '处理完成',
      remark,
    })
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, status: 'completed' } : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === id
          ? { ...state.selectedWorkOrder, status: 'completed' }
          : state.selectedWorkOrder,
    }))
  },
}))
