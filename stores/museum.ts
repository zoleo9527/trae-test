import { defineStore } from 'pinia'
import type { InventoryRecord, User, Notification, CalendarEvent, Product, RecordStatus, RecordType } from '~/types'
import { inventoryRecords } from '~/data/records'
import { users, rolePermissions, roleNames } from '~/data/users'
import { notifications } from '~/data/notifications'
import { calendarEvents } from '~/data/calendar'
import { products } from '~/data/products'

interface FilterState {
  search: string
  status: RecordStatus | 'all'
  type: RecordType | 'all'
  dateRange: {
    start: string
    end: string
  } | null
  priority: 'low' | 'medium' | 'high' | 'all'
  location: string
}

const getBusinessDate = (record: InventoryRecord): string | null => {
  if (record.actualDate) {
    return record.actualDate
  }
  if (record.type === 'restock') {
    return record.expectedDate || null
  }
  if (record.type === 'loss') {
    return record.lossDate || null
  }
  return null
}

const parseDateSafe = (dateString: string): Date => {
  if (dateString.includes('T')) {
    return new Date(dateString)
  }
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
  }
  return new Date(dateString)
}

export const useMuseumStore = defineStore('museum', {
  state: () => ({
    currentUser: users[0] as User,
    records: inventoryRecords as InventoryRecord[],
    notifications: notifications as Notification[],
    calendarEvents: calendarEvents as CalendarEvent[],
    products: products as Product[],
    selectedRecordId: null as string | null,
    selectedDate: null as string | null,
    filters: {
      search: '',
      status: 'all',
      type: 'all',
      dateRange: null,
      priority: 'all',
      location: ''
    } as FilterState,
    isLoading: false
  }),

  getters: {
    currentRole: (state) => state.currentUser.role,
    currentRoleName: (state) => roleNames[state.currentUser.role],
    permissions: (state) => rolePermissions[state.currentUser.role],
    
    unreadNotifications: (state) => 
      state.notifications.filter(n => !n.isRead),
    
    unreadCount: (state) => 
      state.notifications.filter(n => !n.isRead).length,

    filteredRecords: (state): InventoryRecord[] => {
      let result = [...state.records]
      
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        result = result.filter(r => 
          r.productName.toLowerCase().includes(searchLower) ||
          r.productSku.toLowerCase().includes(searchLower) ||
          r.remark.toLowerCase().includes(searchLower) ||
          r.createdByName.toLowerCase().includes(searchLower)
        )
      }
      
      if (state.filters.status !== 'all') {
        result = result.filter(r => r.status === state.filters.status)
      }
      
      if (state.filters.type !== 'all') {
        result = result.filter(r => r.type === state.filters.type)
      }
      
      if (state.filters.priority !== 'all') {
        result = result.filter(r => r.priority === state.filters.priority)
      }
      
      if (state.filters.location) {
        result = result.filter(r => r.location.includes(state.filters.location))
      }
      
      if (state.filters.dateRange) {
        const start = parseDateSafe(state.filters.dateRange.start)
        start.setHours(0, 0, 0, 0)
        const end = parseDateSafe(state.filters.dateRange.end)
        end.setHours(23, 59, 59, 999)
        result = result.filter(r => {
          const businessDate = getBusinessDate(r)
          if (!businessDate) return false
          const recordDate = parseDateSafe(businessDate)
          recordDate.setHours(12, 0, 0, 0)
          return recordDate >= start && recordDate <= end
        })
      }
      
      if (state.selectedDate) {
        const selected = parseDateSafe(state.selectedDate).toDateString()
        result = result.filter(r => {
          const businessDate = getBusinessDate(r)
          if (!businessDate) return false
          return parseDateSafe(businessDate).toDateString() === selected
        })
      }
      
      return result.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    },

    selectedRecord: (state) => 
      state.records.find(r => r.id === state.selectedRecordId) || null,

    eventsByDate: (state) => {
      const grouped: Record<string, CalendarEvent[]> = {}
      state.calendarEvents.forEach(event => {
        if (!grouped[event.date]) {
          grouped[event.date] = []
        }
        grouped[event.date].push(event)
      })
      return grouped
    },

    pendingApprovalCount: (state) => 
      state.records.filter(r => r.status === 'pending').length,

    abnormalCount: (state) => 
      state.records.filter(r => r.status === 'abnormal').length,

    lowStockProducts: (state) =>
      state.products.filter(p => p.currentStock < p.minStock),

    getBusinessDate: () => getBusinessDate
  },

  actions: {
    switchUser(userId: string) {
      const user = users.find(u => u.id === userId)
      if (user) {
        this.currentUser = user
      }
    },

    setSelectedRecord(recordId: string | null) {
      this.selectedRecordId = recordId
    },

    setSelectedDate(date: string | null) {
      this.selectedDate = date
    },

    updateFilters(filters: Partial<FilterState>) {
      this.filters = { ...this.filters, ...filters }
    },

    resetFilters() {
      this.filters = {
        search: '',
        status: 'all',
        type: 'all',
        dateRange: null,
        priority: 'all',
        location: ''
      }
      this.selectedDate = null
    },

    markNotificationRead(notificationId: string) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
    },

    markAllNotificationsRead() {
      this.notifications.forEach(n => n.isRead = true)
    },

    updateRecordStatus(recordId: string, status: RecordStatus, remark: string) {
      const record = this.records.find(r => r.id === recordId)
      if (record) {
        record.status = status
        record.updatedAt = new Date().toISOString()
        record.currentHandler = this.currentUser.id
        record.currentHandlerName = this.currentUser.name
        record.history.push({
          status,
          timestamp: new Date().toISOString(),
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          remark
        })
      }
    },

    createRecord(record: Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'createdBy' | 'createdByName'>) {
      const newRecord: InventoryRecord = {
        ...record,
        id: `r${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: this.currentUser.id,
        createdByName: this.currentUser.name,
        history: [{
          status: record.status,
          timestamp: new Date().toISOString(),
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          remark: '创建记录'
        }]
      }
      this.records.unshift(newRecord)
      return newRecord
    },

    addCalendarEvent(event: Omit<CalendarEvent, 'id'>) {
      const newEvent: CalendarEvent = {
        ...event,
        id: `c${Date.now()}`
      }
      this.calendarEvents.push(newEvent)
      return newEvent
    },

    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) {
      const newNotification: Notification = {
        ...notification,
        id: `n${Date.now()}`,
        timestamp: new Date().toISOString(),
        isRead: false
      }
      this.notifications.unshift(newNotification)
      return newNotification
    }
  }
})
