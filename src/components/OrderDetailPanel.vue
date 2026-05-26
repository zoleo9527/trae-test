<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores'
import type { OrderStatus } from '../types'
import StatusTimeline from './StatusTimeline.vue'

const store = useAppStore()

const order = computed(() => store.selectedOrder)

const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  customizing: { label: '定制中', color: 'badge-blue' },
  arriving: { label: '已到货', color: 'badge-yellow' },
  installing: { label: '安装中', color: 'badge-orange' },
  completed: { label: '已完成', color: 'badge-green' },
  after_sales: { label: '售后中', color: 'badge-red' }
}

function openTicket(ticketId: string) {
  store.selectTicket(ticketId)
}

function back() {
  store.clearSelection()
}
</script>

<template>
  <div v-if="order" class="order-detail">
    <div class="detail-header">
      <button class="btn btn-ghost btn-sm" @click="back">← 返回总览</button>
      <div class="flex items-center gap-3">
        <h2 class="detail-title">{{ order.orderNo }}</h2>
        <span class="badge" :class="statusLabels[order.status].color">
          {{ statusLabels[order.status].label }}
        </span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-main">
        <div class="section-card">
          <div class="section-header"><h3>客户信息</h3></div>
          <div class="customer-info">
            <div class="info-row">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ order.customer.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">电话</span>
              <span class="info-value">{{ order.customer.phone }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">地址</span>
              <span class="info-value">{{ order.customer.address }}</span>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header"><h3>商品清单</h3></div>
          <table class="items-table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>SKU</th>
                <th>数量</th>
                <th>单价</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.id">
                <td class="font-medium">{{ item.name }}</td>
                <td class="text-sm text-gray-500 font-mono">{{ item.sku }}</td>
                <td>{{ item.quantity }}</td>
                <td>¥{{ item.unitPrice.toLocaleString() }}</td>
                <td class="text-sm text-gray-500">{{ item.note || '—' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right font-medium">合计</td>
                <td colspan="2" class="font-semibold text-lg">¥{{ order.totalAmount.toLocaleString() }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="section-card">
          <div class="section-header"><h3>进度时间线</h3></div>
          <StatusTimeline :history="order.statusHistory" />
        </div>

        <div class="section-card" v-if="order.notes.length > 0">
          <div class="section-header"><h3>历史备注</h3></div>
          <div class="notes-list">
            <div v-for="(note, idx) in order.notes" :key="idx" class="note-item">
              <span class="note-dot">•</span>
              {{ note }}
            </div>
          </div>
        </div>
      </div>

      <div class="detail-side">
        <div class="section-card">
          <div class="section-header"><h3>负责团队</h3></div>
          <div class="team-list">
            <div class="team-item">
              <span class="team-icon">💼</span>
              <div>
                <div class="team-role">销售顾问</div>
                <div class="team-name">{{ order.salesConsultant }}</div>
              </div>
            </div>
            <div class="team-item">
              <span class="team-icon">🔧</span>
              <div>
                <div class="team-role">安装协调</div>
                <div class="team-name">{{ order.coordinator }}</div>
              </div>
            </div>
            <div class="team-item">
              <span class="team-icon">📋</span>
              <div>
                <div class="team-role">展厅经理</div>
                <div class="team-name">{{ order.manager }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header"><h3>关键日期</h3></div>
          <div class="dates-list">
            <div class="date-item">
              <span class="date-label">签约</span>
              <span class="date-value">{{ order.contractDate }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">预计到货</span>
              <span class="date-value">{{ order.expectedDelivery }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">实际到货</span>
              <span class="date-value">{{ order.actualDelivery || '—' }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">安装日期</span>
              <span class="date-value">{{ order.installDate || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="section-card" v-if="order.afterSalesTickets.length > 0">
          <div class="section-header">
            <h3>售后工单</h3>
            <span class="badge badge-red">{{ order.afterSalesTickets.length }}</span>
          </div>
          <div class="ticket-refs">
            <div
              v-for="ticket in order.afterSalesTickets"
              :key="ticket.id"
              class="ticket-ref"
              @click="openTicket(ticket.id)"
            >
              <span class="ticket-ref-type" :class="ticket.type === 'compensation' ? 'type-comp' : 'type-supp'">
                {{ ticket.type === 'compensation' ? '赔' : '补' }}
              </span>
              <div class="ticket-ref-info">
                <div class="ticket-ref-title">{{ ticket.title }}</div>
                <div class="ticket-ref-meta">{{ ticket.status }} · {{ ticket.assignee }}</div>
              </div>
              <span class="arrow">→</span>
            </div>
          </div>
        </div>

        <div class="section-card" v-if="order.sampleLendings.length > 0">
          <div class="section-header">
            <h3>样品借出</h3>
          </div>
          <div class="sample-list">
            <div v-for="lending in order.sampleLendings" :key="lending.id" class="sample-item">
              <div class="sample-name">{{ lending.itemName }}</div>
              <div class="sample-meta">
                借给 {{ lending.lentTo }} · {{ lending.lentAt }}
              </div>
              <span class="badge" :class="lending.returned ? 'badge-green' : lending.overdue ? 'badge-red' : 'badge-yellow'">
                {{ lending.returned ? '已归还' : lending.overdue ? '逾期未还' : '未归还' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.customer-info {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  padding: 6px 0;
}

.info-label {
  width: 60px;
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: #374151;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.items-table th {
  text-align: left;
  padding: 10px 16px;
  background: #f9fafb;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.items-table td {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
}

.items-table tfoot td {
  background: #f9fafb;
  font-size: 13px;
}

.notes-list {
  padding: 12px 16px;
}

.note-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  color: #6b7280;
}

.note-dot {
  color: #d1d5db;
  flex-shrink: 0;
}

.team-list {
  padding: 4px 0;
}

.team-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.team-icon {
  font-size: 18px;
}

.team-role {
  font-size: 11px;
  color: #9ca3af;
}

.team-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.dates-list {
  padding: 4px 0;
}

.date-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
}

.date-label {
  font-size: 11px;
  color: #9ca3af;
}

.date-value {
  font-size: 12px;
  color: #374151;
  font-family: 'SF Mono', Menlo, monospace;
}

.ticket-refs {
  padding: 4px 0;
}

.ticket-ref {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.ticket-ref:hover {
  background: #f9fafb;
}

.ticket-ref-type {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.ticket-ref-type.type-supp { background: #dbeafe; color: #2563eb; }
.ticket-ref-type.type-comp { background: #fee2e2; color: #dc2626; }

.ticket-ref-info {
  flex: 1;
  min-width: 0;
}

.ticket-ref-title {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.ticket-ref-meta {
  font-size: 11px;
  color: #9ca3af;
}

.arrow {
  color: #d1d5db;
  font-size: 14px;
}

.sample-list {
  padding: 4px 0;
}

.sample-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.sample-item:last-child {
  border-bottom: none;
}

.sample-name {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.sample-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.font-mono {
  font-family: 'SF Mono', Menlo, monospace;
}
</style>