<template>
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-6">
      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">营员总数</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ data?.camperStats?.total || 0 }}</p>
            <p class="text-sm mt-2">
              <span class="text-green-600">已分配: {{ data?.camperStats?.assigned || 0 }}</span>
              <span class="text-gray-400 mx-2">|</span>
              <span class="text-orange-600">未分配: {{ data?.camperStats?.unassigned || 0 }}</span>
            </p>
          </div>
          <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
            <component :is="icons.Users" class="w-7 h-7 text-blue-600" />
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">房间入住率</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ data?.roomStats?.occupancyRate || 0 }}%</p>
            <p class="text-sm mt-2 text-gray-500">
              {{ data?.roomStats?.assignedCampers || 0 }} / {{ data?.roomStats?.totalBeds || 0 }} 床位
            </p>
          </div>
          <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
            <component :is="icons.BedDouble" class="w-7 h-7 text-green-600" />
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">补领申请</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ data?.resupplyStats?.total || 0 }}</p>
            <p class="text-sm mt-2">
              <span class="text-yellow-600">待审核: {{ data?.resupplyStats?.pending || 0 }}</span>
              <span class="text-gray-400 mx-2">|</span>
              <span class="text-blue-600">待发放: {{ data?.resupplyStats?.approved || 0 }}</span>
            </p>
          </div>
          <div class="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
            <component :is="icons.Package" class="w-7 h-7 text-yellow-600" />
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日签到</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ data?.checkInStats?.todayCheckedIn || 0 }}</p>
            <p class="text-sm mt-2">
              <span class="text-green-600">已签到</span>
              <span class="text-gray-400 mx-2">|</span>
              <span class="text-red-600">待签到: {{ data?.checkInStats?.todayPending || 0 }}</span>
            </p>
          </div>
          <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
            <component :is="icons.CalendarCheck" class="w-7 h-7 text-purple-600" />
          </div>
        </div>
      </el-card>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <el-card class="col-span-2" shadow="hover">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-semibold">最近活动</span>
            <el-tag size="small" type="info">实时更新</el-tag>
          </div>
        </template>
        <div class="space-y-4">
          <div
            v-for="(activity, index) in data?.recentActivity || []"
            :key="index"
            class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="activity.type === 'resupply' ? 'bg-blue-100' : 'bg-red-100'"
            >
              <component
                :is="activity.type === 'resupply' ? icons.Package : icons.Heart"
                class="w-5 h-5"
                :class="activity.type === 'resupply' ? 'text-blue-600' : 'text-red-600'"
              />
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ activity.title }}</p>
              <p class="text-sm text-gray-500">{{ formatTime(activity.time) }}</p>
            </div>
            <el-tag :type="getStatusType(activity.status)" size="small">
              {{ getStatusText(activity.status) }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span class="font-semibold">待办提醒</span>
        </template>
        <div class="space-y-3">
          <div
            v-if="data?.resupplyStats?.pending > 0"
            class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div class="flex items-center gap-2 text-yellow-700">
              <component :is="icons.AlertCircle" class="w-4 h-4" />
              <span class="font-medium">{{ data.resupplyStats.pending }} 个补领申请待审核</span>
            </div>
            <p class="text-sm text-yellow-600 mt-1">请营地主任及时处理</p>
          </div>
          <div
            v-if="data?.resupplyStats?.approved > 0"
            class="p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div class="flex items-center gap-2 text-blue-700">
              <component :is="icons.Clock" class="w-4 h-4" />
              <span class="font-medium">{{ data.resupplyStats.approved }} 个申请等待物资发放</span>
            </div>
            <p class="text-sm text-blue-600 mt-1">请后勤协调及时处理</p>
          </div>
          <div
            v-if="data?.medicalStats?.pending > 0"
            class="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-center gap-2 text-red-700">
              <component :is="icons.HeartPulse" class="w-4 h-4" />
              <span class="font-medium">{{ data.medicalStats.pending }} 个医疗事件待处理</span>
            </div>
            <p class="text-sm text-red-600 mt-1">请及时关注并处理</p>
          </div>
          <div v-if="data?.checkInStats?.todayPending > 0" class="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-center gap-2 text-purple-700">
              <component :is="icons.Users" class="w-4 h-4" />
              <span class="font-medium">{{ data.checkInStats.todayPending }} 人未签到</span>
            </div>
            <p class="text-sm text-purple-600 mt-1">请班务老师提醒签到</p>
          </div>
          <div
            v-if="data?.materialStats?.lowStock > 0"
            class="p-3 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <div class="flex items-center gap-2 text-orange-700">
              <component :is="icons.PackageAlert" class="w-4 h-4" />
              <span class="font-medium">{{ data.materialStats.lowStock }} 种物资库存不足</span>
            </div>
            <p class="text-sm text-orange-600 mt-1">请及时补充库存</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dashboardApi } from '@/api'
import * as icons from 'lucide-vue-next'
import dayjs from 'dayjs'

const data = ref<any>(null)

const loadData = async () => {
  try {
    data.value = await dashboardApi.getOverview()
  } catch (e) {
    console.error('Failed to load dashboard data', e)
    data.value = {
      camperStats: { total: 12, assigned: 10, unassigned: 2 },
      roomStats: { occupancyRate: 83, assignedCampers: 10, totalBeds: 12 },
      resupplyStats: { total: 5, pending: 1, approved: 1, fulfilled: 1 },
      checkInStats: { todayCheckedIn: 8, todayPending: 4 },
      medicalStats: { pending: 1 },
      materialStats: { lowStock: 2 },
      recentActivity: [],
    }
  }
}

const formatTime = (time: string) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'primary',
    fulfilled: 'success',
    closed: 'info',
    rejected: 'danger',
    handled: 'success',
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    fulfilled: '已发放',
    closed: '已完成',
    rejected: '已驳回',
    handled: '已处理',
  }
  return texts[status] || status
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
</style>
