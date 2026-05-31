<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">今日预约</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ todayStats.bookings }}</p>
            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              较昨日 +3
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理投诉</p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ todayStats.pendingComplaints }}</p>
            <p class="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {{ todayStats.urgentComplaints }} 个紧急
            </p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">今日巡场</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ todayStats.patrols }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ todayStats.patrolIssues }} 个待处理问题
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">今日营收</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">¥{{ todayStats.revenue.toFixed(2) }}</p>
            <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              储值消费 ¥{{ todayStats.prepaidSpent.toFixed(2) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">今日待办</h3>
            <button @click="navigateTo('/calendar')" class="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="event in todayEvents"
              :key="event.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="navigateToEvent(event)"
            >
              <div
                class="w-1 h-10 rounded-full flex-shrink-0"
                :class="getEventLineClass(event.type)"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs px-2 py-0.5 rounded"
                    :class="getEventBadgeClass(event.type)"
                  >
                    {{ getEventTypeLabel(event.type) }}
                  </span>
                  <StatusBadge v-if="event.status" :status="event.status" />
                </div>
                <p class="text-sm font-medium text-gray-900 mt-1 truncate">{{ event.title }}</p>
                <p v-if="event.startTime" class="text-xs text-gray-400 mt-0.5">
                  {{ event.startTime }}{{ event.endTime ? ' - ' + event.endTime : '' }}
                </p>
              </div>
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div v-if="todayEvents.length === 0" class="text-center py-8 text-gray-500">
              今日暂无待办事项
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">待审核事项</h3>
            <span class="badge bg-amber-100 text-amber-700">{{ pendingApprovals.length }} 条待处理</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="item in pendingApprovals"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
                  <p class="text-xs text-gray-500">{{ item.submitter }} · {{ item.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="userStore.hasPermission('patrol:approve')"
                  class="btn btn-primary text-xs py-1 px-3"
                  @click="handleApprove(item)"
                >
                  通过
                </button>
                <button
                  v-if="userStore.hasPermission('patrol:approve')"
                  class="btn btn-danger text-xs py-1 px-3"
                  @click="handleReject(item)"
                >
                  驳回
                </button>
              </div>
            </div>
            <div v-if="pendingApprovals.length === 0" class="text-center py-8 text-gray-500">
              暂无待审核事项
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">最近通知</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
            <div
              v-for="notification in recentNotifications"
              :key="notification.id"
              class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'bg-blue-50/50': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="{
                    'bg-red-100 text-red-600': notification.type === 'error',
                    'bg-amber-100 text-amber-600': notification.type === 'warning',
                    'bg-green-100 text-green-600': notification.type === 'success',
                    'bg-blue-100 text-blue-600': notification.type === 'info'
                  }"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ commonStore.formatDateTime(notification.createdAt) }}</p>
                </div>
                <div v-if="!notification.read" class="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
              </div>
            </div>
            <div v-if="recentNotifications.length === 0" class="text-center py-8 text-gray-500">
              暂无通知
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">器材归还提醒</h3>
          <div class="space-y-3">
            <div
              v-for="equipment in dueEquipment"
              :key="equipment.id"
              class="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
            >
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ equipment.name }}</p>
                <p class="text-xs text-gray-500">{{ equipment.borrower }} · 应还 {{ equipment.dueDate }}</p>
              </div>
              <span class="badge bg-red-100 text-red-700">{{ equipment.status }}</span>
            </div>
            <div v-if="dueEquipment.length === 0" class="text-center py-8 text-gray-500">
              暂无到期器材
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-if="userStore.hasPermission('booking:create')"
              @click="navigateTo('/booking')"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-all group"
            >
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">新增预约</span>
            </button>
            <button
              v-if="userStore.hasPermission('patrol:create')"
              @click="navigateTo('/patrol')"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-all group"
            >
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">创建巡场</span>
            </button>
            <button
              v-if="userStore.hasPermission('complaint:create')"
              @click="navigateTo('/complaint')"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-all group"
            >
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">登记投诉</span>
            </button>
            <button
              @click="navigateTo('/calendar')"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-primary-200 transition-all group"
            >
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">查看日历</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { useNotificationStore } from '~/stores/notification'
import { useBookingStore } from '~/stores/booking'
import { useComplaintStore } from '~/stores/complaint'
import { usePatrolStore } from '~/stores/patrol'
import { useEquipmentStore } from '~/stores/equipment'
import StatusBadge from '~/components/StatusBadge.vue'
import type { CalendarEvent, Notification } from '~/types'

const userStore = useUserStore()
const commonStore = useCommonStore()
const notificationStore = useNotificationStore()
const bookingStore = useBookingStore()
const complaintStore = useComplaintStore()
const patrolStore = usePatrolStore()
const equipmentStore = useEquipmentStore()

const today = dayjs().format('YYYY-MM-DD')

const todayStats = computed(() => {
  const todayBookings = bookingStore.bookings.filter(b => b.date === today)
  const pendingComplaints = complaintStore.complaints.filter(c => c.status === 'pending' || c.status === 'processing')
  const urgentComplaints = pendingComplaints.filter(c => c.priority === 'urgent')
  const todayPatrols = patrolStore.patrols.filter(p => p.date === today)
  const todayPatrolIssues = todayPatrols.reduce((acc, p) => acc + p.issues.filter(i => i.status !== 'resolved').length, 0)
  const todayRevenue = todayBookings.reduce((acc, b) => acc + b.totalAmount, 0)
  const todayPrepaidSpent = todayBookings.reduce((acc, b) => acc + b.prepaidDeducted, 0)

  return {
    bookings: todayBookings.length,
    pendingComplaints: pendingComplaints.length,
    urgentComplaints: urgentComplaints.length,
    patrols: todayPatrols.length,
    patrolIssues: todayPatrolIssues,
    revenue: todayRevenue,
    prepaidSpent: todayPrepaidSpent
  }
})

const todayEvents = computed((): CalendarEvent[] => {
  const events: CalendarEvent[] = []

  bookingStore.bookings
    .filter(b => b.date === today)
    .forEach(b => {
      events.push({
        id: `booking-${b.id}`,
        date: b.date,
        type: 'booking',
        title: `${b.customerName} - ${b.type === 'driving_range' ? '练习场' : b.type === 'lesson' ? '教练课' : '推杆区'}`,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        relatedId: b.id,
        priority: b.status === 'pending' ? 'high' : 'medium'
      })
    })

  patrolStore.patrols
    .filter(p => p.date === today)
    .forEach(p => {
      events.push({
        id: `patrol-${p.id}`,
        date: p.date,
        type: 'patrol',
        title: `巡场 - ${p.location}`,
        startTime: p.startTime,
        endTime: p.endTime,
        status: p.status,
        relatedId: p.id,
        priority: p.status === 'pending' ? 'high' : 'medium'
      })
    })

  complaintStore.complaints
    .filter(c => c.status === 'pending' || c.status === 'processing')
    .forEach(c => {
      events.push({
        id: `complaint-${c.id}`,
        date: today,
        type: 'complaint',
        title: c.title,
        status: c.status,
        relatedId: c.id,
        priority: c.priority
      })
    })

  equipmentStore.equipment
    .filter(e => e.status === 'borrowed')
    .forEach(e => {
      const activeBorrow = e.borrowHistory.find(b => b.status === 'active')
      if (activeBorrow && dayjs(activeBorrow.expectedReturnDate).isSame(dayjs(), 'day')) {
        events.push({
          id: `equipment-${e.id}`,
          date: today,
          type: 'equipment_due',
          title: `${e.name} 到期归还`,
          status: 'overdue',
          relatedId: e.id,
          priority: 'high'
        })
      }
    })

  return events.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const pa = a.priority ? priorityOrder[a.priority] : 4
    const pb = b.priority ? priorityOrder[b.priority] : 4
    return pa - pb
  })
})

const pendingApprovals = computed(() => {
  const approvals: Array<{
    id: string
    type: 'patrol' | 'complaint'
    title: string
    submitter: string
    time: string
    status: string
  }> = []

  patrolStore.patrols
    .filter(p => p.status === 'pending')
    .forEach(p => {
      approvals.push({
        id: p.id,
        type: 'patrol',
        title: `巡场记录 ${p.patrolNo} 待审核`,
        submitter: p.operatorName,
        time: commonStore.formatDateTime(p.createdAt),
        status: p.status
      })
    })

  complaintStore.complaints
    .filter(c => c.status === 'pending')
    .forEach(c => {
      approvals.push({
        id: c.id,
        type: 'complaint',
        title: `投诉 ${c.complaintNo} 待分配`,
        submitter: c.customerName,
        time: commonStore.formatDateTime(c.createdAt),
        status: c.status
      })
    })

  return approvals
})

const recentNotifications = computed(() => {
  return notificationStore.myNotifications.slice(0, 5)
})

const dueEquipment = computed(() => {
  const items: Array<{
    id: string
    name: string
    borrower: string
    dueDate: string
    status: string
  }> = []

  equipmentStore.equipment
    .filter(e => e.status === 'borrowed')
    .forEach(e => {
      const activeBorrow = e.borrowHistory.find(b => b.status === 'active')
      if (activeBorrow) {
        const dueDate = dayjs(activeBorrow.expectedReturnDate)
        const daysDiff = dueDate.diff(dayjs(), 'day')
        let status = ''
        if (daysDiff < 0) status = '已逾期'
        else if (daysDiff === 0) status = '今日到期'
        else if (daysDiff <= 2) status = '即将到期'

        if (status) {
          items.push({
            id: e.id,
            name: e.name,
            borrower: activeBorrow.borrowerName,
            dueDate: commonStore.formatDate(activeBorrow.expectedReturnDate),
            status
          })
        }
      }
    })

  return items.sort((a, b) => {
    const order = { '已逾期': 0, '今日到期': 1, '即将到期': 2 }
    return order[a.status as keyof typeof order] - order[b.status as keyof typeof order]
  })
})

function navigateToEvent(event: CalendarEvent) {
  const routeMap: Record<string, string> = {
    booking: `/booking/${event.relatedId}`,
    patrol: `/patrol/${event.relatedId}`,
    complaint: `/complaint/${event.relatedId}`,
    equipment_due: `/equipment/${event.relatedId}`
  }
  if (routeMap[event.type]) {
    navigateTo(routeMap[event.type])
  }
}

function handleApprove(item: { id: string; type: string }) {
  if (item.type === 'patrol') {
    patrolStore.approve(item.id)
  }
}

function handleReject(item: { id: string; type: string }) {
  if (item.type === 'patrol') {
    patrolStore.reject(item.id, '请补充检查项照片和问题描述')
  }
}

function handleNotificationClick(notification: Notification) {
  notificationStore.markAsRead(notification.id)
  if (notification.relatedId && notification.relatedType) {
    const routeMap: Record<string, string> = {
      patrol: `/patrol/${notification.relatedId}`,
      complaint: `/complaint/${notification.relatedId}`,
      booking: `/booking/${notification.relatedId}`,
      equipment: `/equipment/${notification.relatedId}`,
      prepaid: `/prepaid/${notification.relatedId}`
    }
    if (routeMap[notification.relatedType]) {
      navigateTo(routeMap[notification.relatedType])
    }
  }
}

function getEventLineClass(type: string) {
  const map: Record<string, string> = {
    booking: 'bg-blue-500',
    patrol: 'bg-green-500',
    complaint: 'bg-red-500',
    equipment_due: 'bg-purple-500'
  }
  return map[type] || 'bg-gray-500'
}

function getEventBadgeClass(type: string) {
  const map: Record<string, string> = {
    booking: 'bg-blue-100 text-blue-700',
    patrol: 'bg-green-100 text-green-700',
    complaint: 'bg-red-100 text-red-700',
    equipment_due: 'bg-purple-100 text-purple-700'
  }
  return map[type] || 'bg-gray-100 text-gray-700'
}

function getEventTypeLabel(type: string) {
  const map: Record<string, string> = {
    booking: '球道预约',
    patrol: '巡场任务',
    complaint: '投诉跟进',
    equipment_due: '器材归还'
  }
  return map[type] || type
}
</script>
