<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { useExhibitStore } from '@/stores/exhibit'
import { useTicketStore } from '@/stores/ticket'
import { useExceptionStore } from '@/stores/exception'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import PriorityTag from '@/components/common/PriorityTag.vue'
import { PackageOpen, TicketCheck, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-vue-next'

const exhibitStore = useExhibitStore()
const ticketStore = useTicketStore()
const exceptionStore = useExceptionStore()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const activeExceptions = computed(() => 
  exceptionStore.sortedExceptions.filter(e => e.status !== 'closed' && e.status !== 'resolved').slice(0, 5)
)

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
      textStyle: {
        color: '#556260',
        fontSize: 13
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: false
          }
        },
        data: [
          { value: exhibitStore.pendingCount, name: '待确认', itemStyle: { color: '#9AA8A6' } },
          { value: exhibitStore.transferringCount, name: '流转中', itemStyle: { color: '#D4A853' } },
          { value: exhibitStore.installingCount, name: '布展中', itemStyle: { color: '#5A8A6C' } },
          { value: exhibitStore.completedCount, name: '已完成', itemStyle: { color: '#5A8A6C' } },
          { value: exhibitStore.exceptionCount, name: '异常', itemStyle: { color: '#E07050' } }
        ]
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

const openException = (id: string) => {
  exceptionStore.openDrawer(id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="进行中借调" 
        :value="exhibitStore.transferringCount + exhibitStore.installingCount"
        subtitle="展品流转中"
        :icon="PackageOpen"
        color="dark"
        :trend="8"
      />
      <StatCard 
        title="今日核销" 
        :value="ticketStore.verifiedTickets"
        :subtitle="`核销率 ${ticketStore.verifyRate}%`"
        :icon="TicketCheck"
        color="gold"
        :trend="12"
      />
      <StatCard 
        title="待处理异常" 
        :value="exceptionStore.pendingCount"
        subtitle="需要立即处理"
        :icon="AlertTriangle"
        color="coral"
      />
      <StatCard 
        title="已完成借调" 
        :value="exhibitStore.completedCount"
        subtitle="本月完成"
        :icon="CheckCircle"
        color="green"
        :trend="5"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-museum p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-museum-gray-800 font-serif">展品状态分布</h3>
            <p class="text-sm text-museum-gray-500">当前所有借调单状态统计</p>
          </div>
          <div class="flex items-center gap-2 text-sm text-museum-gray-500">
            <TrendingUp class="w-4 h-4" />
            <span>实时更新</span>
          </div>
        </div>
        <div ref="chartRef" class="h-64"></div>
      </div>

      <div class="bg-white rounded-xl shadow-museum p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-museum-gray-800 font-serif">异常处理队列</h3>
          <span 
            v-if="activeExceptions.length > 0"
            class="text-xs bg-museum-coral/10 text-museum-coral px-2 py-1 rounded-full"
          >
            {{ activeExceptions.length }} 项待处理
          </span>
        </div>
        
        <div class="space-y-3">
          <div 
            v-for="exception in activeExceptions"
            :key="exception.id"
            class="p-3 rounded-lg border border-museum-gray-200 hover:border-museum-gold/50 hover:bg-museum-gray-50 cursor-pointer transition-all group"
            @click="openException(exception.id)"
          >
            <div class="flex items-start gap-3">
              <span 
                class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                :class="{
                  'bg-museum-coral animate-pulse': exception.priority === 'urgent',
                  'bg-museum-orange': exception.priority === 'high',
                  'bg-museum-gold': exception.priority === 'medium'
                }"
              ></span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <PriorityTag :priority="exception.priority" />
                  <StatusTag :status="exception.status" type="exception" />
                </div>
                <p class="text-sm font-medium text-museum-gray-800 truncate group-hover:text-museum-gold transition-colors">
                  {{ exception.title }}
                </p>
                <div class="flex items-center gap-1 mt-1 text-xs text-museum-gray-500">
                  <Clock class="w-3 h-3" />
                  <span>{{ exception.reportTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeExceptions.length === 0" class="text-center py-8 text-museum-gray-400">
            <CheckCircle class="w-12 h-12 mx-auto mb-2 text-museum-green/50" />
            <p class="text-sm">暂无待处理异常</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
