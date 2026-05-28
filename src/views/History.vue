<template>
  <div class="history-page">
    <div class="page-header">
      <h2 class="page-title">历史追溯</h2>
      <p class="page-desc">全链路历史记录 · 状态变化 · 责任人追踪</p>
    </div>

    <div class="filter-bar card">
      <div class="filter-item">
        <label>订单筛选</label>
        <select v-model="orderFilter" class="select">
          <option value="all">全部订单</option>
          <option v-for="order in orders" :key="order.id" :value="order.id">
            {{ order.orderNo }} - {{ order.customer }}
          </option>
        </select>
      </div>
      <div class="filter-item">
        <label>角色筛选</label>
        <select v-model="roleFilter" class="select">
          <option value="all">全部角色</option>
          <option value="business">项目商务</option>
          <option value="sample">打样跟单</option>
          <option value="warehouse">仓配协调</option>
        </select>
      </div>
      <div class="filter-item">
        <label>操作类型</label>
        <select v-model="actionFilter" class="select">
          <option value="all">全部操作</option>
          <option value="create">创建订单</option>
          <option value="sample">打样相关</option>
          <option value="production">生产相关</option>
          <option value="shipment">发货相关</option>
          <option value="aftersale">售后相关</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="card-body" style="padding: 30px 40px">
        <div v-if="filteredHistory.length === 0" class="empty-state">
          <div class="empty-icon">📜</div>
          <p>暂无历史记录</p>
        </div>
        <div v-else class="history-timeline">
          <div v-for="(item, index) in filteredHistory" :key="index"
               class="history-item"
               :class="getItemClass(item.action)">
            <div class="item-dot"></div>
            <div class="item-content">
              <div class="item-header">
                <span class="item-time">{{ formatTime(item.time) }}</span>
                <span class="item-action">{{ item.action }}</span>
              </div>
              <div class="item-remark">{{ item.remark }}</div>
              <div class="item-meta">
                <span class="order-ref">
                  <span class="label">订单</span>
                  <span class="order-no text-link" @click="goToOrder(item.orderId)">
                    {{ item.orderNo }}
                  </span>
                </span>
                <span class="operator">
                  <span class="label">操作人</span>
                  <span class="name">{{ item.operator }}</span>
                </span>
                <span class="role">
                  <span class="label">角色</span>
                  <span class="role-tag">{{ getRoleName(item.operatorRole) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card stats-card">
      <div class="card-header">
        <h3 class="card-title">异常记录统计</h3>
      </div>
      <div class="card-body">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon" style="background: #fff1f0">⚠️</div>
            <div class="stat-info">
              <div class="stat-value">{{ versionConflictCount }}</div>
              <div class="stat-label">版本覆盖风险</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon" style="background: #fffbe6">📦</div>
            <div class="stat-info">
              <div class="stat-value">{{ splitShipmentCount }}</div>
              <div class="stat-label">拆单发货记录</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon" style="background: #f6ffed">🔗</div>
            <div class="stat-info">
              <div class="stat-value">{{ chainCompleteness }}%</div>
              <div class="stat-label">责任链完整度</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'

const router = useRouter()
const appStore = useAppStore()
const { orders } = storeToRefs(appStore)

const orderFilter = ref('all')
const roleFilter = ref('all')
const actionFilter = ref('all')

const roleNames = {
  business: '项目商务',
  sample: '打样跟单',
  warehouse: '仓配协调'
}

const allHistory = computed(() => {
  const list = []
  orders.value.forEach(order => {
    if (order.history && order.history.length > 0) {
      order.history.forEach(h => {
        list.push({
          ...h,
          orderId: order.id,
          orderNo: order.orderNo,
          customer: order.customer
        })
      })
    }
  })
  return list.sort((a, b) => new Date(b.time) - new Date(a.time))
})

const filteredHistory = computed(() => {
  let list = allHistory.value

  if (orderFilter.value !== 'all') {
    list = list.filter(item => item.orderId === orderFilter.value)
  }

  if (roleFilter.value !== 'all') {
    list = list.filter(item => item.operatorRole === roleFilter.value)
  }

  if (actionFilter.value !== 'all') {
    list = list.filter(item => {
      const action = item.action.toLowerCase()
      if (actionFilter.value === 'create') return action.includes('创建')
      if (actionFilter.value === 'sample') return action.includes('打样') || action.includes('版本')
      if (actionFilter.value === 'production') return action.includes('量产') || action.includes('生产')
      if (actionFilter.value === 'shipment') return action.includes('发货')
      if (actionFilter.value === 'aftersale') return action.includes('售后') || action.includes('退款') || action.includes('补单')
      return true
    })
  }

  return list
})

const versionConflictCount = computed(() =>
  allHistory.value.filter(h => h.action.includes('版本') && h.remark?.includes('更新')).length
)

const splitShipmentCount = computed(() =>
  orders.value.filter(o => o.shipments && o.shipments.length > 1).length
)

const chainCompleteness = computed(() => {
  const afterSalesWithIssues = orders.value.filter(o =>
    o.afterSales && o.afterSales.length > 0
  ).length
  if (afterSalesWithIssues === 0) return 100

  const completeChains = orders.value.filter(o => {
    if (!o.afterSales) return false
    return o.afterSales.every(as =>
      as.logs && as.logs.length >= 3
    )
  }).length

  return Math.round((completeChains / afterSalesWithIssues) * 100)
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function getRoleName(role) {
  return roleNames[role] || role
}

function getItemClass(action) {
  if (action.includes('售后') || action.includes('退款')) return 'error'
  if (action.includes('完成')) return 'success'
  if (action.includes('异常') || action.includes('更新') || action.includes('修改')) return 'warning'
  return 'default'
}

function goToOrder(orderId) {
  router.push(`/order/${orderId}`)
}
</script>

<style scoped>
.history-page {
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

.filter-bar {
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #595959;
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
  padding: 20px;
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

.history-timeline {
  position: relative;
}

.history-item {
  position: relative;
  padding-left: 40px;
  padding-bottom: 24px;
}

.history-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: #f0f0f0;
}

.item-dot {
  position: absolute;
  left: 4px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #1890ff;
  z-index: 1;
}

.history-item.warning .item-dot {
  background: #faad14;
  box-shadow: 0 0 0 2px #faad14;
}

.history-item.error .item-dot {
  background: #f5222d;
  box-shadow: 0 0 0 2px #f5222d;
}

.history-item.success .item-dot {
  background: #52c41a;
  box-shadow: 0 0 0 2px #52c41a;
}

.item-content {
  padding: 8px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.item-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 6px;
}

.item-time {
  font-family: monospace;
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.item-action {
  font-weight: 600;
  font-size: 14px;
}

.item-remark {
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
}

.item-meta .label {
  color: #8c8c8c;
  margin-right: 4px;
}

.order-no {
  font-family: monospace;
}

.role-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 0 6px;
  border-radius: 3px;
}

.stats-card {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
}
</style>