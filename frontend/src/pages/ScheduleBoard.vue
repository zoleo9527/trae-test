<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Calendar,
  Clock,
  ChefHat,
  AlertTriangle,
  Edit3,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import { useScheduleStore } from '@/stores/schedule'
import { useOrderStore } from '@/stores/order'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  formatDate,
} from '@/lib/utils'

const scheduleStore = useScheduleStore()
const orderStore = useOrderStore()

const currentDate = ref(new Date().toISOString().slice(0, 10))

const stations = ['蛋糕线', '酥皮线', '吐司线', '千层线', '面包线', '塔线', '蛋糕卷线']
const timeSlots = ['06:00-08:00', '07:00-09:00', '08:00-10:00', '09:00-12:00', '10:00-14:00']

const schedulesByDate = computed(() => {
  return scheduleStore.scheduleItems.filter(s => s.date === currentDate.value)
})

function getScheduleForStationAndSlot(station: string, timeSlot: string) {
  return schedulesByDate.value.filter(s => s.station === station && s.timeSlot === timeSlot)
}

function getOrderById(orderId: string) {
  return orderStore.getOrderById(orderId)
}

function changeDate(days: number) {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + days)
  currentDate.value = d.toISOString().slice(0, 10)
}

const dailyStats = computed(() => {
  const items = schedulesByDate.value
  return {
    total: items.length,
    completed: items.filter(s => s.status === 'completed').length,
    producing: items.filter(s => s.status === 'producing').length,
    pending: items.filter(s => s.status === 'pending').length,
    changed: items.filter(s => s.isChanged).length,
    remake: items.filter(s => s.isRemake).length,
  }
})
</script>

<template>
  <div class="schedule-page">
    <div class="card p-5 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            class="p-2 rounded-lg hover:bg-bakery-100 transition-colors"
            @click="changeDate(-1)"
          >
            <ChevronLeft class="w-5 h-5 text-bakery-600" />
          </button>

          <div class="text-center">
            <div class="text-xl font-semibold text-bakery-800">{{ formatDate(currentDate) }}</div>
            <div class="text-xs text-bakery-500">产能排期表</div>
          </div>

          <button
            class="p-2 rounded-lg hover:bg-bakery-100 transition-colors"
            @click="changeDate(1)"
          >
            <ChevronRight class="w-5 h-5 text-bakery-600" />
          </button>
        </div>

        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-bakery-800 font-mono">{{ dailyStats.total }}</div>
            <div class="text-xs text-bakery-500">总排产</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600 font-mono">{{ dailyStats.completed }}</div>
            <div class="text-xs text-bakery-500">已完成</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-bakery-600 font-mono">{{ dailyStats.producing }}</div>
            <div class="text-xs text-bakery-500">生产中</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600 font-mono">{{ dailyStats.changed }}</div>
            <div class="text-xs text-bakery-500">改单排产</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600 font-mono">{{ dailyStats.remake }}</div>
            <div class="text-xs text-bakery-500">补做排产</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead>
            <tr class="bg-bakery-50">
              <th class="text-left px-4 py-3 text-xs font-medium text-bakery-500 w-28 border-r border-bakery-200 sticky left-0 bg-bakery-50 z-10">
                <div class="flex items-center gap-1.5">
                  <ChefHat class="w-4 h-4" />
                  工位 / 时段
                </div>
              </th>
              <th
                v-for="slot in timeSlots"
                :key="slot"
                class="text-left px-4 py-3 text-xs font-medium text-bakery-500 min-w-[180px] border-r border-bakery-200"
              >
                <div class="flex items-center gap-1.5">
                  <Clock class="w-4 h-4" />
                  {{ slot }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="station in stations"
              :key="station"
              class="border-b border-bakery-100 last:border-b-0"
            >
              <td class="px-4 py-4 border-r border-bakery-200 bg-white sticky left-0 z-10">
                <span class="text-sm font-medium text-bakery-800">{{ station }}</span>
              </td>
              <td
                v-for="slot in timeSlots"
                :key="slot"
                class="px-3 py-3 border-r border-bakery-100 align-top"
              >
                <div class="space-y-2">
                  <div
                    v-for="item in getScheduleForStationAndSlot(station, slot)"
                    :key="item.id"
                    class="p-2.5 rounded-lg border transition-all hover:shadow-sm"
                    :class="[
                      item.status === 'completed' ? 'bg-green-50 border-green-200' :
                      item.status === 'producing' ? 'bg-bakery-50 border-bakery-300' :
                      'bg-white border-bakery-200',
                      item.isChanged ? 'ring-1 ring-purple-400' : '',
                      item.isRemake ? 'ring-1 ring-orange-400' : '',
                    ]"
                  >
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <span class="font-mono text-xs text-bakery-500">{{ item.id }}</span>
                      <div class="flex items-center gap-1">
                        <Edit3
                          v-if="item.isChanged"
                          class="w-3 h-3 text-purple-500"
                          title="改单排产"
                        />
                        <RotateCcw
                          v-if="item.isRemake"
                          class="w-3 h-3 text-orange-500"
                          title="补做排产"
                        />
                      </div>
                    </div>
                    <div class="text-xs font-medium text-bakery-800 truncate">
                      {{ getOrderById(item.orderId)?.customerName }}
                    </div>
                    <div class="text-[11px] text-bakery-500 truncate mt-0.5">
                      {{ getOrderById(item.orderId)?.items?.map((i: any) => i.name).join('、') }}
                    </div>
                    <div class="mt-2">
                      <StatusBadge :status="item.status" type="schedule" />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-5 py-3 bg-bakery-50 border-t border-bakery-200 flex items-center gap-6">
        <div class="flex items-center gap-2 text-xs text-bakery-600">
          <div class="w-3 h-3 rounded bg-purple-400"></div>
          <span>改单排产</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-bakery-600">
          <div class="w-3 h-3 rounded bg-orange-400"></div>
          <span>补做排产</span>
        </div>
        <div class="flex-1" />
        <div class="text-xs text-bakery-500">
          当日产能：
          <span class="font-medium text-bakery-700">{{ dailyStats.completed }}/{{ dailyStats.total }}</span>
          已完成
        </div>
      </div>
    </div>
  </div>
</template>

