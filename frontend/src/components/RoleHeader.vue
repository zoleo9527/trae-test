<script setup lang="ts">
import { computed } from 'vue'
import { User, ChefHat, UserCog, AlertCircle } from 'lucide-vue-next'
import { useRole } from '@/composables/useRole'
import { useOrderStore } from '@/stores/order'
import { useScheduleStore } from '@/stores/schedule'
import { useRemakeStore } from '@/stores/remake'
import { useRefundStore } from '@/stores/refund'
import { useReviewStore } from '@/stores/review'

const { currentRole, roleName } = useRole()
const orderStore = useOrderStore()
const scheduleStore = useScheduleStore()
const remakeStore = useRemakeStore()
const refundStore = useRefundStore()
const reviewStore = useReviewStore()

const roleIcon = computed(() => {
  const map = {
    manager: UserCog,
    kitchen: ChefHat,
    service: User,
  }
  return map[currentRole.value]
})

const roleStats = computed(() => {
  const role = currentRole.value
  if (role === 'manager') {
    return [
      { label: '待复核', count: reviewStore.pendingReviews.length, type: 'review' as const },
      { label: '待确认订单', count: orderStore.pendingOrders.length, type: 'order' as const },
      { label: '异常订单', count: orderStore.exceptionOrders.length, type: 'exception' as const },
      { label: '待处理退款', count: refundStore.pendingRefunds.length, type: 'refund' as const },
    ]
  } else if (role === 'kitchen') {
    return [
      { label: '今日排产', count: scheduleStore.todaySchedule.length, type: 'schedule' as const },
      { label: '待排产', count: scheduleStore.pendingSchedule.length, type: 'schedule' as const },
      { label: '开放补做', count: remakeStore.openTickets.length, type: 'remake' as const },
      { label: '改单排产', count: scheduleStore.changedSchedule.filter(s => s.status !== 'completed').length, type: 'change' as const },
    ]
  } else {
    return [
      { label: '待核销', count: 3, type: 'pickup' as const },
      { label: '待通知', count: 2, type: 'pickup' as const },
      { label: '改单待传', count: 1, type: 'change' as const },
      { label: '客诉待登记', count: 0, type: 'complaint' as const },
    ]
  }
})

const totalPending = computed(() => roleStats.value.reduce((sum, s) => sum + s.count, 0))
</script>

<template>
  <div class="card p-5 mb-6">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-bakery-100 flex items-center justify-center">
          <component :is="roleIcon" class="w-6 h-6 text-bakery-600" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-bakery-800">
            {{ roleName }}工作台
          </h2>
          <p class="text-sm text-bakery-500 mt-0.5">
            今天是 {{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}
          </p>
        </div>
      </div>

      <div v-if="totalPending > 0" class="flex items-center gap-2 text-accent">
        <AlertCircle class="w-5 h-5" />
        <span class="text-sm font-medium">{{ totalPending }} 项待处理</span>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 mt-5">
      <div
        v-for="stat in roleStats"
        :key="stat.label"
        class="bg-bakery-50 rounded-lg p-3 border border-bakery-100"
      >
        <div class="text-2xl font-bold text-bakery-800 font-mono">
          {{ stat.count }}
        </div>
        <div class="text-xs text-bakery-500 mt-1">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>
