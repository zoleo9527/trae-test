import { defineStore } from 'pinia'
import type { OverviewStats, TodoItem, TrendData } from '~/types'
import { mockTrendData, mockTodos } from '~/data/mock'

interface DashboardState {
  stats: OverviewStats
  trendData: TrendData[]
  todos: TodoItem[]
  loading: boolean
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    stats: {
      todayOrders: 0,
      pendingOrders: 0,
      abnormalOrders: 0,
      completionRate: 0,
      totalRevenue: 0,
      avgProcessingTime: 0,
    },
    trendData: [],
    todos: [],
    loading: false,
  }),

  getters: {
    highPriorityTodos: (state): TodoItem[] => {
      return state.todos.filter(t => t.priority === 'high').sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.getTime() - b.deadline.getTime()
      })
    },

    allTodosSorted: (state): TodoItem[] => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return [...state.todos].sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.getTime() - b.deadline.getTime()
      })
    },
  },

  actions: {
    async fetchData(orders: any[]) {
      this.loading = true
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const today = new Date().toDateString()
      const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
      const pendingOrders = orders.filter(o => ['pending', 'preparing', 'processing', 'quality_check'].includes(o.status))
      const abnormalOrders = orders.filter(o => o.status === 'abnormal')
      const completedOrders = orders.filter(o => o.status === 'completed')
      const totalRevenue = orders.reduce((sum, o) => sum + o.price.total, 0)

      this.stats = {
        todayOrders: todayOrders.length,
        pendingOrders: pendingOrders.length,
        abnormalOrders: abnormalOrders.length,
        completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
        totalRevenue,
        avgProcessingTime: 5.2,
      }
      
      this.trendData = mockTrendData
      this.todos = mockTodos
      
      this.loading = false
    },

    completeTodo(todoId: string) {
      this.todos = this.todos.filter(t => t.id !== todoId)
    },

    addTodo(todo: Omit<TodoItem, 'id'>) {
      this.todos.push({
        ...todo,
        id: Date.now().toString(),
      })
    },
  },
})
