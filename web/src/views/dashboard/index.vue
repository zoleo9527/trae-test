<template>
  <div class="dashboard">
    <div class="stats-row">
      <el-card shadow="hover" class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          </div>
          <div class="stat-icon" :style="{ background: stat.bgColor }">
            <el-icon :size="24" :color="stat.color"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <div class="content-row">
      <div class="main-content">
        <el-card class="task-card">
          <template #header>
            <div class="card-header">
              <span>待办任务 - {{ userStore.currentUser.roleName }}视角</span>
              <el-tag size="small" type="info">按角色自动分配</el-tag>
            </div>
          </template>
          <div class="task-tabs">
            <el-radio-group v-model="activeTaskTab" size="small">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="my">指派给我</el-radio-button>
              <el-radio-button value="urgent">紧急</el-radio-button>
            </el-radio-group>
          </div>
          <el-table :data="filteredTasks" stripe style="width: 100%" @row-click="handleTaskClick">
            <el-table-column prop="title" label="任务名称" min-width="180">
              <template #default="{ row }">
                <div class="task-title">
                  <el-icon :color="priorityColor(row.priority)"><Flag /></el-icon>
                  <span>{{ row.title }}</span>
                  <el-tag v-if="row.priority === 'urgent'" type="danger" size="small" effect="dark">紧急</el-tag>
                  <el-tag v-else-if="row.priority === 'high'" type="warning" size="small">高</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="详情" min-width="250" show-overflow-tooltip />
            <el-table-column label="关联订单" width="140">
              <template #default="{ row }">
                <el-link v-if="row.relatedOrderId" type="primary" @click.stop="goToOrder(row.relatedOrderId)">
                  查看订单
                </el-link>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" text @click.stop="handleTaskClick(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="filteredTasks.length === 0" description="暂无待办任务" />
        </el-card>

        <el-card class="timeline-card">
          <template #header>
            <div class="card-header">
              <span>近期动态</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="item in timeline"
              :key="item.id"
              :timestamp="formatDateTime(item.createdAt)"
              :type="item.type"
            >
              <div class="timeline-content">
                <strong>{{ item.title }}</strong>
                <p class="timeline-desc">{{ item.description }}</p>
                <el-tag size="small" type="info">{{ item.operator }}</el-tag>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>

      <div class="side-content">
        <el-card class="side-card">
          <template #header>
            <span>今日安装</span>
          </template>
          <div class="today-installs">
            <div v-for="item in todayInstalls" :key="item.id" class="install-item" @click="goToInstallation(item.id)">
              <div class="install-time">{{ item.timeSlot }}</div>
              <div class="install-info">
                <div class="install-customer">{{ item.order?.customer?.name }}</div>
                <div class="install-address">{{ item.order?.customer?.address }}</div>
                <el-tag :type="appointmentStatusType(item.status)" size="small">
                  {{ appointmentStatusLabel(item.status) }}
                </el-tag>
              </div>
            </div>
            <el-empty v-if="todayInstalls.length === 0" description="今日无安装安排" :image-size="80" />
          </div>
        </el-card>

        <el-card class="side-card">
          <template #header>
            <div class="card-header">
              <span>逾期样品</span>
              <el-tag v-if="overdueSamples.length > 0" type="danger" size="small">{{ overdueSamples.length }}笔</el-tag>
            </div>
          </template>
          <div class="overdue-list">
            <div v-for="item in overdueSamples" :key="item.id" class="overdue-item">
              <div class="overdue-header">
                <span class="overdue-name">{{ item.customerName }}</span>
                <el-tag type="danger" size="small">逾期 {{ daysOverdue(item.expectedReturnDate) }} 天</el-tag>
              </div>
              <div class="overdue-product">{{ item.productName }} x{{ item.quantity }}</div>
              <div class="overdue-actions">
                <el-button size="small" type="warning" @click="remindSample(item.id)">催还</el-button>
                <el-button size="small" type="primary" @click="goToSample">查看详情</el-button>
              </div>
            </div>
            <el-empty v-if="overdueSamples.length === 0" description="无逾期样品" :image-size="80" />
          </div>
        </el-card>

        <el-card class="side-card">
          <template #header>
            <div class="card-header">
              <span>待处理异常</span>
              <el-tag v-if="openExceptions.length > 0" type="warning" size="small">{{ openExceptions.length }}笔</el-tag>
            </div>
          </template>
          <div class="exception-list">
            <div v-for="item in openExceptions" :key="item.id" class="exception-item" @click="goToException(item.id)">
              <el-tag :type="exceptionTypeType(item.type)" size="small">{{ exceptionTypeLabel(item.type) }}</el-tag>
              <div class="exception-title">{{ item.title }}</div>
              <div class="exception-customer">{{ item.order?.customer?.name }}</div>
            </div>
            <el-empty v-if="openExceptions.length === 0" description="无待处理异常" :image-size="80" />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { orderApi, installationApi, sampleApi, exceptionApi, notificationApi } from '@/api'
import {
  orderStatusMap, appointmentStatusMap, exceptionTypeMap,
  formatDateTime, notificationPriorityMap
} from '@/utils/constants'

const router = useRouter()
const userStore = useUserStore()
const activeTaskTab = ref('all')

const orderStats = ref<any>({})
const tasks = ref<any[]>([])
const todayInstalls = ref<any[]>([])
const overdueSamples = ref<any[]>([])
const openExceptions = ref<any[]>([])
const timeline = ref<any[]>([])

const stats = computed(() => [
  { label: '订单总数', value: orderStats.value.total || 0, color: '#409eff', bgColor: '#ecf5ff', icon: 'Tickets' },
  { label: '待安装', value: orderStats.value.delivered || 0, color: '#e6a23c', bgColor: '#fdf6ec', icon: 'Tools' },
  { label: '安装中', value: orderStats.value.installing || 0, color: '#67c23a', bgColor: '#f0f9eb', icon: 'Setting' },
  { label: '异常单', value: orderStats.value.exception || 0, color: '#f56c6c', bgColor: '#fef0f0', icon: 'Warning' },
  { label: '已完成', value: orderStats.value.completed || 0, color: '#909399', bgColor: '#f4f4f5', icon: 'CircleCheck' },
])

const filteredTasks = computed(() => {
  let list = tasks.value
  if (activeTaskTab.value === 'my') {
    list = list.filter(t => t.recipientRole === userStore.currentUser.role)
  } else if (activeTaskTab.value === 'urgent') {
    list = list.filter(t => t.priority === 'urgent' || t.priority === 'high')
  }
  return list
})

function priorityColor(priority: string) {
  const map: Record<string, string> = {
    low: '#909399',
    medium: '#409eff',
    high: '#e6a23c',
    urgent: '#f56c6c'
  }
  return map[priority] || '#909399'
}

function appointmentStatusType(status: string) {
  return appointmentStatusMap[status]?.type || 'info'
}

function appointmentStatusLabel(status: string) {
  return appointmentStatusMap[status]?.label || status
}

function exceptionTypeType(type: string) {
  return exceptionTypeMap[type]?.type || 'info'
}

function exceptionTypeLabel(type: string) {
  return exceptionTypeMap[type]?.label || type
}

function daysOverdue(date: string) {
  if (!date) return 0
  const diff = Date.now() - new Date(date).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

async function loadData() {
  try {
    const statsRes = await orderApi.getStats()
    orderStats.value = statsRes

    const taskRes = await notificationApi.getList({ pageSize: 20, isRead: false })
    tasks.value = taskRes.items || []

    const today = new Date().toISOString().split('T')[0]
    const installRes = await installationApi.getList({ pageSize: 10, startDate: today, endDate: today })
    todayInstalls.value = installRes.items || []

    const sampleRes = await sampleApi.getOverdue()
    overdueSamples.value = sampleRes || []

    const excRes = await exceptionApi.getList({ pageSize: 10, status: 'open' })
    openExceptions.value = excRes.items || []

    timeline.value = [
      { id: 1, title: '订单 FJ202605200001 验收通过', description: '张先生家的家具安装完成，客户满意度5星', type: 'success', operator: '展厅经理-王姐', createdAt: new Date(Date.now() - 3600000 * 2) },
      { id: 2, title: '异常单 #3 待处理', description: '王总办公室样品逾期未归还，已发送2次催还提醒', type: 'warning', operator: 'system', createdAt: new Date(Date.now() - 3600000 * 5) },
      { id: 3, title: '订单 FJ202605210002 开始安装', description: '李女士家定制衣柜今日安装，预计4小时完成', type: 'primary', operator: '安装协调-李工', createdAt: new Date(Date.now() - 3600000 * 8) },
      { id: 4, title: '补件已下单', description: '王总订单缺失的餐边柜和电视柜已加急生产', type: 'info', operator: '安装协调-张工', createdAt: new Date(Date.now() - 3600000 * 24) },
    ]
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

function handleTaskClick(row: any) {
  if (row.relatedOrderId) {
    router.push(`/orders/${row.relatedOrderId}`)
  }
}

function goToOrder(orderId: number) {
  router.push(`/orders/${orderId}`)
}

function goToInstallation(id: number) {
  router.push(`/installations?id=${id}`)
}

function goToException(id: number) {
  router.push(`/exceptions?id=${id}`)
}

function goToSample() {
  router.push('/samples')
}

function remindSample(id: number) {
  sampleApi.remind(id, '请尽快归还样品，以免影响其他客户选型')
  ElMessage.success('催还提醒已发送')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 600;
  }
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.content-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-card {
  margin-bottom: 20px;
}

.task-tabs {
  margin-bottom: 16px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-card {
  .timeline-content {
    p {
      margin: 4px 0;
      color: #606266;
      font-size: 13px;
    }
  }
}

.side-card {
  margin-bottom: 20px;
}

.install-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f5f7fa;
  }

  .install-time {
    font-weight: 600;
    color: #409eff;
    min-width: 80px;
  }

  .install-customer {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .install-address {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }
}

.overdue-item, .exception-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f5f7fa;
  }
}

.overdue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.overdue-name {
  font-weight: 500;
}

.overdue-product {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.overdue-actions {
  display: flex;
  gap: 8px;
}

.exception-title {
  font-weight: 500;
  margin: 4px 0;
}

.exception-customer {
  font-size: 12px;
  color: #909399;
}
</style>
