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
  selectedWorkOrder: null,
  fetchWorkOrders: async (filters) => {
    set({ loading: true })
    await new Promise((r) => setTimeout(r, 200))
    let result = [...mockWorkOrders]
    if (filters?.status) {
      result = result.filter((wo) => wo.status === filters.status)
    }
    if (filters?.priority) {
      result = result.filter((wo) => wo.priority === filters.priority)
    }
    if (filters?.type) {
      result = result.filter((wo) => wo.type === filters.type)
    }
    if (filters?.siteId) {
      result = result.filter((wo) => wo.siteId === filters.siteId)
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(
        (wo) =>
          wo.title.toLowerCase().includes(kw) ||
          wo.description.toLowerCase().includes(kw) ||
          wo.siteName.toLowerCase().includes(kw)
      )
    }
    set({ workOrders: result, loading: false })
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
    }))
  },
  createWorkOrder: async (data) => {
    const newWo: WorkOrder = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      logs: [],
      attachments: [],
    }
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
    }))
  },
}))
