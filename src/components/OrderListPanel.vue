<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores'
import type { Order, OrderStatus } from '../types'

const store = useAppStore()

const statusLabels: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  customizing: { label: '定制中', color: 'badge-blue', dot: '#3b82f6' },
  arriving: { label: '已到货', color: 'badge-yellow', dot: '#f59e0b' },
  installing: { label: '安装中', color: 'badge-orange', dot: '#f97316' },
  completed: { label: '已完成', color: 'badge-green', dot: '#10b981' },
  after_sales: { label: '售后中', color: 'badge-red', dot: '#ef4444' }
}

const filteredOrders = computed(() => store.orders)

function selectOrder(order: Order) {
  store.selectOrder(order.id)
}
</script>

<template>
  <div class="order-list-panel">
    <div class="panel-header">
      <h3>订单列表</h3>
      <span class="order-count">{{ filteredOrders.length }} 单</span>
    </div>

    <div class="order-list">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        :class="{ selected: store.selectedOrderId === order.id, 'has-after-sales': order.afterSalesTickets.length > 0 }"
        @click="selectOrder(order)"
      >
        <div class="order-card-header">
          <span class="order-no">{{ order.orderNo }}</span>
          <span class="badge" :class="statusLabels[order.status].color">
            <span class="status-dot" :style="{ background: statusLabels[order.status].dot }"></span>
            {{ statusLabels[order.status].label }}
          </span>
        </div>

        <div class="order-customer">{{ order.customer.name }} · {{ order.customer.phone }}</div>
        <div class="order-address truncate">{{ order.customer.address }}</div>

        <div class="order-items">
          <span v-for="(item, idx) in order.items.slice(0, 2)" :key="item.id" class="order-item-name">
            {{ item.name }}<template v-if="idx < Math.min(order.items.length, 2) - 1">、</template>
          </span>
          <span v-if="order.items.length > 2" class="more-items">+{{ order.items.length - 2 }}</span>
        </div>

        <div class="order-card-footer">
          <span class="order-meta">销售：{{ order.salesConsultant }}</span>
          <span class="order-amount">¥{{ order.totalAmount.toLocaleString() }}</span>
        </div>

        <div v-if="order.afterSalesTickets.length > 0" class="after-sales-badge">
          <span class="as-icon">⚠</span>
          {{ order.afterSalesTickets.length }} 条售后待处理
        </div>

        <div v-if="order.sampleLendings.some(l => !l.returned)" class="sample-badge">
          <span class="sample-icon">📦</span>
          {{ order.sampleLendings.filter(l => !l.returned).length }} 个样品未归还
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-list-panel {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.order-count {
  font-size: 12px;
  color: #9ca3af;
}

.order-list {
  padding: 8px;
  flex: 1;
  overflow-y: auto;
}

.order-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.order-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.order-card.selected {
  border-color: #6366f1;
  background: linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.12);
}

.order-card.has-after-sales {
  border-left: 3px solid #ef4444;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.order-no {
  font-size: 12px;
  font-weight: 600;
  color: #4f46e5;
  font-family: 'SF Mono', Menlo, monospace;
}

.order-customer {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.order-address {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.order-items {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 8px;
}

.order-item-name {
  color: #4b5563;
}

.more-items {
  color: #6366f1;
  font-weight: 500;
}

.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-meta {
  font-size: 11px;
  color: #9ca3af;
}

.order-amount {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.after-sales-badge {
  margin-top: 8px;
  padding: 4px 8px;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 11px;
  color: #dc2626;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.as-icon {
  font-size: 11px;
}

.sample-badge {
  margin-top: 4px;
  padding: 4px 8px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 11px;
  color: #d97706;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sample-icon {
  font-size: 11px;
}
</style>