<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores'
import type { OrderStatus } from '../types'

const store = useAppStore()

const stats = computed(() => store.statsByRole)

const statusFlow: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'customizing', label: '定制中', icon: '⚙' },
  { key: 'arriving', label: '已到货', icon: '📦' },
  { key: 'installing', label: '安装中', icon: '🔧' },
  { key: 'completed', label: '已完成', icon: '✓' },
  { key: 'after_sales', label: '售后中', icon: '⚠' }
]

function openTicket(ticketId: string) {
  store.selectTicket(ticketId)
}

function openOrder(orderId: string) {
  store.selectOrder(orderId)
}
</script>

<template>
  <div class="overview-dashboard">
    <div class="dashboard-header">
      <div>
        <h2>工作台总览</h2>
        <p class="text-sm text-gray-500">以「{{ store.roleInfo.name }}」视角查看</p>
      </div>
    </div>

    <div class="stats-grid">
      <div v-if="store.currentRole === 'manager'" class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-value">{{ stats.activeAfterSales }}</div>
          <div class="stat-label">进行中售后</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-value">{{ stats.pendingApproval }}</div>
          <div class="stat-label">待审批赔付</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-value">{{ stats.unconfirmedParts }}</div>
          <div class="stat-label">未确认补件</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-value">{{ stats.overdueLendings }}</div>
          <div class="stat-label">逾期未还样品</div>
        </div>
      </div>

      <div v-else-if="store.currentRole === 'consultant'" class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats.myTickets }}</div>
          <div class="stat-label">我负责的售后</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-value">{{ stats.pendingResponse }}</div>
          <div class="stat-label">待响应</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-value">{{ stats.processing }}</div>
          <div class="stat-label">处理中</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-value">{{ stats.needFollowup }}</div>
          <div class="stat-label">样品需跟进</div>
        </div>
      </div>

      <div v-else class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats.installingOrders }}</div>
          <div class="stat-label">安装中订单</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-value">{{ stats.arrivingOrders }}</div>
          <div class="stat-label">待预约安装</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-value">{{ stats.partsToTrack }}</div>
          <div class="stat-label">补件追踪中</div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>订单状态分布</h3>
      </div>
      <div class="status-flow">
        <div
          v-for="(step, idx) in statusFlow"
          :key="step.key"
          class="flow-step"
          :class="{ active: store.orders.filter(o => o.status === step.key).length > 0 }"
        >
          <div class="flow-icon">{{ step.icon }}</div>
          <div class="flow-label">{{ step.label }}</div>
          <div class="flow-count">{{ store.orders.filter(o => o.status === step.key).length }}</div>
          <div v-if="idx < statusFlow.length - 1" class="flow-arrow">→</div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3>待处理售后工单</h3>
        <span class="badge badge-red">{{ store.pendingTickets.length }}</span>
      </div>
      <div class="ticket-list">
        <div
          v-for="ticket in store.pendingTickets"
          :key="ticket.id"
          class="ticket-item"
          @click="openTicket(ticket.id)"
        >
          <div class="ticket-left">
            <span class="ticket-type" :class="ticket.type === 'compensation' ? 'type-comp' : 'type-supp'">
              {{ ticket.type === 'compensation' ? '赔付' : '补件' }}
            </span>
            <div class="ticket-info">
              <div class="ticket-title">{{ ticket.title }}</div>
              <div class="ticket-meta">
                {{ ticket.relatedOrder?.orderNo }} · 分配给 {{ ticket.assignee }} · {{ ticket.createdAt }}
              </div>
            </div>
          </div>
          <div class="ticket-right">
            <span class="badge" :class="ticket.priority === 'high' ? 'badge-red' : ticket.priority === 'medium' ? 'badge-yellow' : 'badge-gray'">
              {{ ticket.priority === 'high' ? '紧急' : ticket.priority === 'medium' ? '一般' : '低' }}
            </span>
          </div>
        </div>
        <div v-if="store.pendingTickets.length === 0" class="empty-state">
          <div class="empty-icon">✓</div>
          <p>暂无待处理售后工单</p>
        </div>
      </div>
    </div>

    <div class="section-card" v-if="store.overdueLendings.length > 0">
      <div class="section-header">
        <h3>逾期未归还样品</h3>
        <span class="badge badge-red">{{ store.overdueLendings.length }}</span>
      </div>
      <div class="lending-list">
        <div
          v-for="lending in store.overdueLendings"
          :key="lending.id"
          class="lending-item"
          @click="openOrder(lending.orderId)"
        >
          <div class="lending-icon">📦</div>
          <div class="lending-info">
            <div class="lending-name">{{ lending.itemName }}</div>
            <div class="lending-meta">
              借给 {{ lending.lentTo }} · 应归还 {{ lending.expectedReturn }} · 已逾期
            </div>
          </div>
          <span class="badge badge-red">逾期</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-dashboard {
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 20px;
}

.dashboard-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stats-grid {
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  text-align: center;
  transition: transform 0.15s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-warning .stat-value { color: #f59e0b; }
.stat-danger .stat-value { color: #ef4444; }
.stat-info .stat-value { color: #6366f1; }

.section-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.status-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  overflow-x: auto;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.4;
  flex-shrink: 0;
}

.flow-step.active {
  opacity: 1;
}

.flow-icon {
  font-size: 20px;
}

.flow-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.flow-count {
  font-size: 16px;
  font-weight: 700;
  color: #6366f1;
}

.flow-arrow {
  color: #d1d5db;
  font-size: 16px;
  margin-top: -20px;
}

.flow-step.active + .flow-arrow {
  color: #6366f1;
}

.ticket-list {
  padding: 8px;
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.ticket-item:hover {
  background: #f9fafb;
}

.ticket-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.ticket-type {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.type-supp {
  background: #dbeafe;
  color: #2563eb;
}

.type-comp {
  background: #fee2e2;
  color: #dc2626;
}

.ticket-info {
  flex: 1;
  min-width: 0;
}

.ticket-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.ticket-meta {
  font-size: 11px;
  color: #9ca3af;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  color: #10b981;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 13px;
  color: #9ca3af;
}

.lending-list {
  padding: 8px;
}

.lending-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
}

.lending-item:hover {
  background: #f9fafb;
}

.lending-icon {
  font-size: 20px;
}

.lending-info {
  flex: 1;
}

.lending-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.lending-meta {
  font-size: 11px;
  color: #9ca3af;
}
</style>