<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">工作台</h2>
      <p class="page-desc">欢迎回来，{{ currentUser.name }}！{{ currentRoleDesc }}</p>
    </div>

    <div class="stats-row">
      <div v-for="stat in stats" :key="stat.label" class="stat-card card">
        <div class="stat-icon" :style="{ background: stat.color }">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="content-row">
      <div class="card content-card">
        <div class="card-header">
          <h3 class="card-title">待处理事项</h3>
        </div>
        <div class="card-body">
          <div v-if="pendingTasks.length === 0" class="empty-state">
            <div class="empty-icon">✅</div>
            <p>暂无待处理事项</p>
          </div>
          <div v-else class="task-list">
            <div v-for="task in pendingTasks" :key="task.id" class="task-item">
              <div class="task-left">
                <span class="task-icon" :class="'task-' + task.type">{{ task.icon }}</span>
                <div class="task-info">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-desc">{{ task.orderNo }} - {{ task.customer }}</div>
                </div>
              </div>
              <div class="task-right">
                <span class="task-time">{{ task.time }}</span>
                <button class="btn btn-primary btn-sm" @click="goToOrder(task.orderId)">处理</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card content-card">
        <div class="card-header">
          <h3 class="card-title">最近动态</h3>
        </div>
        <div class="card-body">
          <div class="timeline">
            <div v-for="(item, index) in recentActivities" :key="index" 
                 class="timeline-item" :class="item.type">
              <div class="timeline-time">{{ item.time }}</div>
              <div class="timeline-content">
                <div class="timeline-action">{{ item.action }}</div>
                <div class="timeline-remark">{{ item.remark }}</div>
                <div class="timeline-meta">
                  <span>{{ item.operator }}</span>
                  <span class="timeline-order">{{ item.orderNo }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'

const router = useRouter()
const appStore = useAppStore()
const { currentRole, currentUser, orders, filteredOrders, afterSalesOrders } = storeToRefs(appStore)

const currentRoleDesc = computed(() => {
  const descs = {
    business: '您可以查看订单进度、发起售后申请',
    sample: '您可以处理打样确认、审核售后申请',
    warehouse: '您可以管理发货、执行补单操作'
  }
  return descs[currentRole.value] || ''
})

const stats = computed(() => [
  { label: '全部订单', value: filteredOrders.value.length, icon: '📋', color: '#1890ff' },
  { label: '进行中', value: filteredOrders.value.filter(o =>
    ['production', 'partial_shipped', 'shipped'].includes(o.status)
  ).length, icon: '⚡', color: '#faad14' },
  { label: '售后中', value: afterSalesOrders.value.filter(o =>
    o.afterSales.some(a => a.status === 'pending' || a.status === 'processing')
  ).length, icon: '🔧', color: '#f5222d' },
  { label: '已完成', value: filteredOrders.value.filter(o => o.status === 'completed').length, icon: '✅', color: '#52c41a' }
])

const pendingTasks = computed(() => {
  const tasks = []

  orders.value.forEach(order => {
    if (order.afterSales && order.afterSales.length > 0) {
      order.afterSales.forEach(as => {
        if (currentRole.value === 'sample') {
          if (as.status === 'pending') {
            tasks.push({
              id: `${order.id}-${as.id}`,
              type: as.type,
              icon: as.type === 'refund' ? '💰' : '📦',
              title: `${as.type === 'refund' ? '退款' : '补单'}待审核：${as.reason}`,
              orderNo: order.orderNo,
              customer: order.customer,
              orderId: order.id,
              time: dayjs(as.createdAt).fromNow()
            })
          }
          if (as.type === 'refund' && as.status === 'approved') {
            tasks.push({
              id: `${order.id}-${as.id}`,
              type: as.type,
              icon: '💰',
              title: `退款待处理：${order.productName}`,
              orderNo: order.orderNo,
              customer: order.customer,
              orderId: order.id,
              time: dayjs(as.logs[as.logs.length - 1]?.time).fromNow()
            })
          }
          if (as.type === 'refund' && as.status === 'processing') {
            tasks.push({
              id: `${order.id}-${as.id}`,
              type: as.type,
              icon: '💰',
              title: `退款处理中，待完成：${order.productName}`,
              orderNo: order.orderNo,
              customer: order.customer,
              orderId: order.id,
              time: dayjs(as.logs[as.logs.length - 1]?.time).fromNow()
            })
          }
        }
        if (currentRole.value === 'warehouse' && as.type === 'reorder') {
          if (as.status === 'approved') {
            tasks.push({
              id: `${order.id}-${as.id}`,
              type: 'reorder',
              icon: '📦',
              title: `补单待发货：${order.productName}`,
              orderNo: order.orderNo,
              customer: order.customer,
              orderId: order.id,
              time: dayjs(as.logs[as.logs.length - 1]?.time).fromNow()
            })
          }
          if (as.status === 'processing') {
            tasks.push({
              id: `${order.id}-${as.id}`,
              type: 'reorder',
              icon: '📦',
              title: `补单处理中，待完成：${order.productName}`,
              orderNo: order.orderNo,
              customer: order.customer,
              orderId: order.id,
              time: dayjs(as.logs[as.logs.length - 1]?.time).fromNow()
            })
          }
        }
        if (currentRole.value === 'business' && as.status === 'completed') {
          tasks.push({
            id: `${order.id}-${as.id}`,
            type: as.type,
            icon: '✓',
            title: `售后完成，待确认：${order.productName}`,
            orderNo: order.orderNo,
            customer: order.customer,
            orderId: order.id,
            time: dayjs(as.logs[as.logs.length - 1]?.time).fromNow()
          })
        }
      })
    }

    if (currentRole.value === 'warehouse' && order.status === 'production') {
      tasks.push({
        id: `ship-${order.id}`,
        type: 'shipment',
        icon: '🚚',
        title: `待发货：${order.productName}`,
        orderNo: order.orderNo,
        customer: order.customer,
        orderId: order.id,
        time: `预计 ${dayjs(order.deliveryDate).format('MM-DD')}`
      })
    }
  })

  return tasks.slice(0, 8)
})

const recentActivities = computed(() => {
  const activities = []
  orders.value.forEach(order => {
    if (order.history && order.history.length > 0) {
      order.history.forEach(h => {
        activities.push({
          ...h,
          orderNo: order.orderNo,
          type: h.action.includes('售后') || h.action.includes('退款') ? 'error' :
                h.action.includes('完成') ? 'success' :
                h.action.includes('异常') ? 'warning' : ''
        })
      })
    }
  })
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
    .map(a => ({
      ...a,
      time: dayjs(a.time).format('MM-DD HH:mm')
    }))
})

function goToOrder(orderId) {
  router.push(`/order/${orderId}`)
}
</script>

<style scoped>
.dashboard {
  padding-bottom: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}

.page-desc {
  color: #8c8c8c;
  font-size: 13px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  color: #8c8c8c;
  font-size: 13px;
}

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.content-card {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.card-body {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  transition: background 0.2s;
}

.task-item:hover {
  background: #f5f5f5;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.task-reorder {
  background: #e6f7ff;
}

.task-refund {
  background: #fff1f0;
}

.task-shipment {
  background: #f6ffed;
}

.task-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.task-desc {
  font-size: 12px;
  color: #8c8c8c;
}

.task-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-time {
  font-size: 12px;
  color: #8c8c8c;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: #f0f0f0;
}

.timeline-item {
  position: relative;
  padding-bottom: 16px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1890ff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #1890ff;
}

.timeline-item.warning::before {
  background: #faad14;
  box-shadow: 0 0 0 2px #faad14;
}

.timeline-item.error::before {
  background: #f5222d;
  box-shadow: 0 0 0 2px #f5222d;
}

.timeline-item.success::before {
  background: #52c41a;
  box-shadow: 0 0 0 2px #52c41a;
}

.timeline-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.timeline-action {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.timeline-remark {
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}

.timeline-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #8c8c8c;
}

.timeline-order {
  font-family: monospace;
  background: #f5f5f5;
  padding: 0 6px;
  border-radius: 3px;
}
</style>