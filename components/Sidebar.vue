<template>
  <aside class="w-64 bg-golf-green text-white flex flex-col shadow-lg">
    <div class="p-6 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold">高尔夫练习场</h1>
          <p class="text-xs text-white/60">巡场与投诉管理系统</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 py-4 overflow-y-auto scrollbar-thin">
      <ul class="space-y-1 px-3">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="item.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            :class="{
              'bg-white/20 text-white': isActive(item.path),
              'text-white/70 hover:bg-white/10 hover:text-white': !isActive(item.path)
            }"
            v-show="!item.permission || userStore.hasPermission(item.permission)"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-medium">{{ item.label }}</span>
            <span
              v-if="item.badge && item.badge() > 0"
              class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ item.badge() }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="p-4 border-t border-white/10">
      <div class="bg-white/10 rounded-lg p-4">
        <p class="text-sm text-white/80 mb-2">快速统计</p>
        <div class="grid grid-cols-2 gap-2">
          <div class="text-center">
            <p class="text-xl font-bold">{{ bookingStore.todayCount }}</p>
            <p class="text-xs text-white/60">今日预约</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold">{{ complaintStore.pendingCount }}</p>
            <p class="text-xs text-white/60">待处理投诉</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useComplaintStore } from '~/stores/complaint'
import { useBookingStore } from '~/stores/booking'
import { usePatrolStore } from '~/stores/patrol'
import { useEquipmentStore } from '~/stores/equipment'

const route = useRoute()
const userStore = useUserStore()
const complaintStore = useComplaintStore()
const bookingStore = useBookingStore()
const patrolStore = usePatrolStore()
const equipmentStore = useEquipmentStore()

const IconDashboard = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '3', y: '3', width: '7', height: '9', rx: '1' }),
      h('rect', { x: '14', y: '3', width: '7', height: '5', rx: '1' }),
      h('rect', { x: '14', y: '12', width: '7', height: '9', rx: '1' }),
      h('rect', { x: '3', y: '16', width: '7', height: '5', rx: '1' })
    ])
  }
}

const IconCalendar = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
      h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
      h('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
    ])
  }
}

const IconSearch = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
    ])
  }
}

const IconAlert = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
    ])
  }
}

const IconBooking = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
      h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
      h('line', { x1: '3', y1: '10', x2: '21', y2: '10' }),
      h('line', { x1: '8', y1: '14', x2: '8', y2: '18' }),
      h('line', { x1: '12', y1: '14', x2: '12', y2: '18' }),
      h('line', { x1: '16', y1: '14', x2: '16', y2: '18' })
    ])
  }
}

const IconWallet = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4' }),
      h('path', { d: 'M4 6v12c0 1.1.9 2 2 2h14v-4' }),
      h('path', { d: 'M18 12a2 2 0 012 2v0a2 2 0 01-2 2H6v-6h12z' })
    ])
  }
}

const IconTools = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' })
    ])
  }
}

const menuItems = [
  {
    path: '/',
    label: '工作台',
    icon: IconDashboard,
    permission: null
  },
  {
    path: '/calendar',
    label: '日历视图',
    icon: IconCalendar,
    permission: null
  },
  {
    path: '/patrol',
    label: '巡场记录',
    icon: IconSearch,
    permission: 'patrol:view',
    badge: () => patrolStore.pendingCount
  },
  {
    path: '/complaint',
    label: '投诉跟进',
    icon: IconAlert,
    permission: 'complaint:view',
    badge: () => complaintStore.pendingCount + complaintStore.processingCount
  },
  {
    path: '/booking',
    label: '预约管理',
    icon: IconBooking,
    permission: 'booking:view',
    badge: () => bookingStore.pendingCount
  },
  {
    path: '/prepaid',
    label: '储值账户',
    icon: IconWallet,
    permission: 'prepaid:view'
  },
  {
    path: '/equipment',
    label: '器材管理',
    icon: IconTools,
    permission: 'equipment:view',
    badge: () => equipmentStore.overdueCount
  }
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
