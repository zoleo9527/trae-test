<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalMembers }}</div>
            <div class="stat-label">会员总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">💰</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatPoints(stats.totalPoints) }}</div>
            <div class="stat-label">总积分</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingOrders }}</div>
            <div class="stat-label">待处理订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card warning" @click="$router.push('/inspection')">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.abnormalOrders }}</div>
            <div class="stat-label">异常订单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="relay-card">
      <template #header>
        <div class="card-header">
          <span>🎯 业务接力视图</span>
          <el-tag type="info" size="small">当前处理节点高亮</el-tag>
        </div>
      </template>
      
      <div class="relay-flow">
        <div 
          v-for="(node, index) in businessFlowWithStatus" 
          :key="node.id"
          class="relay-node"
          :class="[
            node.status,
            { 'is-role': isCurrentUserRole(node.role) }
          ]"
        >
          <div class="node-avatar">
            <span class="avatar-icon">{{ getRoleAvatar(node.role) }}</span>
            <div class="node-status-dot"></div>
          </div>
          <div class="node-content">
            <div class="node-name">{{ node.name }}</div>
            <div class="node-role">{{ getRoleLabel(node.role) }}</div>
            <div v-if="node.time" class="node-time">{{ node.time }}</div>
            <div v-if="node.operator" class="node-operator">操作人: {{ node.operator }}</div>
          </div>
          <div v-if="index < businessFlowWithStatus.length - 1" class="node-arrow">
            <el-icon><Right /></el-icon>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="my-tasks">
        <h4>📍 我的待办</h4>
        <el-table :data="myPendingOrders" style="width: 100%" size="small">
          <el-table-column prop="orderNo" label="订单号" width="160" />
          <el-table-column prop="productName" label="商品" width="180">
            <template #default="{ row }">
              <span>{{ row.productImage }} {{ row.productName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="memberName" label="会员" width="100" />
          <el-table-column prop="totalPoints" label="积分" width="100" />
          <el-table-column prop="currentHandler" label="当前处理" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getRoleLabel(row.currentHandler) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.isAbnormal ? 'danger' : 'primary'">
                {{ row.isAbnormal ? '异常' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="goToOrder(row.id)">
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>📈 积分趋势（近7天）</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>🏷️ 兑换分类占比</span>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>🔥 最近兑换</span>
              <el-button type="primary" size="small" link @click="$router.push('/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="orderNo" label="订单号" width="140" />
            <el-table-column prop="productName" label="商品">
              <template #default="{ row }">
                {{ row.productImage }} {{ row.productName }}
              </template>
            </el-table-column>
            <el-table-column prop="memberName" label="会员" width="80" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>⚠️ 异常预警</span>
              <el-badge :value="warnings.length" type="danger" />
            </div>
          </template>
          <div class="warning-list">
            <div v-for="item in warnings" :key="item.id" class="warning-item">
              <el-icon class="warning-icon" :color="item.color">
                <component :is="item.icon" />
              </el-icon>
              <div class="warning-content">
                <div class="warning-title">{{ item.title }}</div>
                <div class="warning-desc">{{ item.desc }}</div>
              </div>
              <el-button size="small" type="primary" link @click="handleWarning(item)">
                处理
              </el-button>
            </div>
            <el-empty v-if="warnings.length === 0" description="暂无异常" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Right, Warning, CircleClose, Clock, Connection } from '@element-plus/icons-vue'
import { useAuthStore, useOrderStore, useProductStore, useDashboardStore } from '@/stores'
import { BusinessFlow, RoleLabels, ExchangeOrderStatusLabels, UserRole } from '@/types'
import * as echarts from 'echarts'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const productStore = useProductStore()
const dashboardStore = useDashboardStore()

const trendChartRef = ref()
const pieChartRef = ref()

const stats = computed(() => dashboardStore.stats)

const businessFlowWithStatus = computed(() => {
  const flow = JSON.parse(JSON.stringify(BusinessFlow))
  const sampleOrder = orderStore.orders.find(o => !o.isAbnormal && o.status !== 'verified')
  
  if (sampleOrder) {
    const statusMap: Record<string, number> = {
      'pending': 0,
      'confirmed': 1,
      'shipped': 2,
      'delivered': 3,
      'verified': 4
    }
    const currentStep = statusMap[sampleOrder.status] || 0
    
    flow.forEach((node: any, index: number) => {
      if (index < currentStep) {
        node.status = 'completed'
      } else if (index === currentStep) {
        node.status = 'current'
      } else {
        node.status = 'pending'
      }
    })

    if (sampleOrder.confirmBy) flow[1].operator = sampleOrder.confirmBy
    if (sampleOrder.shipBy) flow[2].operator = sampleOrder.shipBy
    if (sampleOrder.verifyBy) flow[4].operator = sampleOrder.verifyBy
  }
  
  return flow
})

const myPendingOrders = computed(() => {
  const user = authStore.currentUser
  if (!user) return []
  
  return orderStore.orders.filter(o => {
    if (user.role === UserRole.WAREHOUSE) {
      return o.status === 'confirmed'
    }
    if (user.role === UserRole.STORE_MANAGER) {
      return (o.status === 'pending' || o.status === 'delivered') && 
             o.storeId === user.storeId
    }
    return o.isAbnormal
  }).slice(0, 5)
})

const recentOrders = computed(() => {
  return [...orderStore.orders]
    .sort((a, b) => new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime())
    .slice(0, 5)
})

const warnings = computed(() => {
  const list: any[] = []
  
  const syncFailed = productStore.syncFailedProducts
  if (syncFailed.length > 0) {
    list.push({
      id: 'sync',
      icon: 'Connection',
      color: '#f56c6c',
      title: '联名商品同步失败',
      desc: `${syncFailed.length}个联名商品库存同步异常`,
      type: 'sync'
    })
  }
  
  const abnormal = orderStore.abnormalOrders
  if (abnormal.length > 0) {
    list.push({
      id: 'abnormal',
      icon: 'Warning',
      color: '#e6a23c',
      title: '异常订单待处理',
      desc: `${abnormal.length}个订单需要跟进处理`,
      type: 'abnormal'
    })
  }
  
  const lowStock = productStore.products.filter(p => p.availableStock < 10)
  if (lowStock.length > 0) {
    list.push({
      id: 'stock',
      icon: 'CircleClose',
      color: '#f56c6c',
      title: '库存不足预警',
      desc: `${lowStock.length}个商品库存低于10件`,
      type: 'stock'
    })
  }
  
  return list
})

const getRoleAvatar = (role: string) => {
  const avatars: Record<string, string> = {
    [UserRole.STORE_MANAGER]: '👨‍💼',
    [UserRole.WAREHOUSE]: '👷',
    [UserRole.PLANNER]: '👩‍💻'
  }
  return avatars[role] || '👤'
}

const getRoleLabel = (role: string) => {
  return RoleLabels[role as keyof typeof RoleLabels] || role
}

const isCurrentUserRole = (role: string) => {
  return authStore.currentUser?.role === role
}

const getStatusLabel = (status: string) => {
  return ExchangeOrderStatusLabels[status as keyof typeof ExchangeOrderStatusLabels] || status
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'pending': 'warning',
    'confirmed': 'primary',
    'shipped': 'info',
    'delivered': 'success',
    'verified': 'success',
    'cancelled': 'danger'
  }
  return types[status] || 'info'
}

const goToOrder = (id: string) => {
  router.push(`/orders/${id}`)
}

const handleWarning = (item: any) => {
  if (item.type === 'sync' || item.type === 'stock') {
    router.push('/products')
  } else if (item.type === 'abnormal') {
    router.push('/orders')
  }
}

const initCharts = () => {
  const trendChart = echarts.init(trendChartRef.value)
  const trendData = dashboardStore.getPointsTrend()
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['获取积分', '消耗积分'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: trendData.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '获取积分',
        type: 'line',
        smooth: true,
        data: trendData.map(d => d.earn),
        areaStyle: { opacity: 0.3 },
        color: '#67c23a'
      },
      {
        name: '消耗积分',
        type: 'line',
        smooth: true,
        data: trendData.map(d => d.spend),
        areaStyle: { opacity: 0.3 },
        color: '#409eff'
      }
    ]
  })

  const pieChart = echarts.init(pieChartRef.value)
  const pieData = dashboardStore.getExchangeByCategory()
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: pieData
    }]
  })

  window.addEventListener('resize', () => {
    trendChart.resize()
    pieChart.resize()
  })
}

const formatPoints = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}

onMounted(() => {
  setTimeout(initCharts, 100)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  border: 1px solid #fef0f0;
}

.stat-card.warning:hover {
  border-color: #f56c6c;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  float: left;
  margin-right: 15px;
}

.stat-icon.blue {
  background: #ecf5ff;
}

.stat-icon.green {
  background: #f0f9eb;
}

.stat-icon.orange {
  background: #fdf6ec;
}

.stat-icon.red {
  background: #fef0f0;
}

.stat-content {
  overflow: hidden;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-top: 5px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.relay-card {
  margin-bottom: 0;
}

.relay-flow {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  padding: 20px 0;
  overflow-x: auto;
}

.relay-node {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
  padding: 15px;
  border-radius: 12px;
  transition: all 0.3s;
}

.relay-node.pending {
  opacity: 0.5;
}

.relay-node.current {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  border: 2px solid #667eea;
}

.relay-node.completed {
  opacity: 0.8;
}

.relay-node.is-role {
  background: #e6f7ff;
  border-color: #1890ff;
}

.node-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar-icon {
  font-size: 36px;
  display: block;
}

.node-status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: #dcdfe6;
}

.relay-node.current .node-status-dot {
  background: #67c23a;
  animation: pulse 2s infinite;
}

.relay-node.completed .node-status-dot {
  background: #67c23a;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.node-content {
  flex: 1;
}

.node-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.node-role {
  color: #666;
  font-size: 12px;
  margin-top: 3px;
}

.node-time, .node-operator {
  color: #999;
  font-size: 11px;
  margin-top: 2px;
}

.node-arrow {
  position: absolute;
  right: -10px;
  color: #dcdfe6;
  font-size: 24px;
  z-index: 1;
}

.my-tasks h4 {
  margin-bottom: 15px;
  color: #333;
}

.charts-row, .bottom-row {
  margin-bottom: 0;
}

.chart-container {
  height: 300px;
}

.warning-list {
  min-height: 200px;
}

.warning-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 10px;
}

.warning-icon {
  font-size: 20px;
  margin-right: 12px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.warning-desc {
  color: #999;
  font-size: 12px;
  margin-top: 3px;
}
</style>
