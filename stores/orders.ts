import { defineStore } from 'pinia'
import type { Order, FilterOptions, OrderStatus, OrderType } from '~/types'
import { mockOrders } from '~/data/mock'

interface OrdersState {
  orders: Order[]
  selectedOrder: Order | null
  filters: FilterOptions
  loading: boolean
}

export const useOrdersStore = defineStore('orders', {
  state: (): OrdersState => ({
    orders: [],
    selectedOrder: null,
    filters: {},
    loading: false,
  }),

  getters: {
    filteredOrders: (state): Order[] => {
      let result = [...state.orders]

      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        result = result.filter(
          o =>
            o.orderNo.toLowerCase().includes(search) ||
            o.customer.name.toLowerCase().includes(search) ||
            o.customer.phone.includes(search)
        )
      }

      if (state.filters.status && state.filters.status.length > 0) {
        result = result.filter(o => state.filters.status!.includes(o.status))
      }

      if (state.filters.type && state.filters.type.length > 0) {
        result = result.filter(o => state.filters.type!.includes(o.type))
      }

      return result
    },

    ordersByStatus: (state) => {
      return (status: OrderStatus) => state.orders.filter(o => o.status === status)
    },

    ordersByType: (state) => {
      return (type: OrderType) => state.orders.filter(o => o.type === type)
    },

    abnormalOrders: (state): Order[] => {
      return state.orders.filter(o => o.status === 'abnormal' || o.abnormalRecords.length > 0)
    },

    getOrderById: (state) => {
      return (id: string) => state.orders.find(o => o.id === id)
    },

    stats: (state) => ({
      total: state.orders.length,
      pending: state.orders.filter(o => o.status === 'pending').length,
      processing: state.orders.filter(o => ['preparing', 'processing', 'quality_check'].includes(o.status)).length,
      completed: state.orders.filter(o => o.status === 'completed').length,
      abnormal: state.orders.filter(o => o.status === 'abnormal').length,
    }),
  },

  actions: {
    async fetchOrders() {
      this.loading = true
      await new Promise(resolve => setTimeout(resolve, 500))
      this.orders = mockOrders
      this.loading = false
    },

    selectOrder(order: Order | null) {
      this.selectedOrder = order
    },

    setFilters(filters: FilterOptions) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {}
    },

    updateOrderProgress(orderId: string, stepId: string, status: string, remark?: string) {
      const order = this.orders.find(o => o.id === orderId)
      if (order) {
        const step = order.progress.find(p => p.id === stepId)
        if (step) {
          step.status = status as any
          if (remark) step.remark = remark
          step.endTime = status === 'completed' ? new Date() : undefined
        }
      }
    },

    addNote(orderId: string, content: string, operator: string) {
      const order = this.orders.find(o => o.id === orderId)
      if (order) {
        order.notes.push({
          id: Date.now().toString(),
          content,
          createdAt: new Date(),
          operator,
        })
      }
    },
  },
})
