<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '../stores'

const store = useAppStore()
const activeTab = ref<'parts' | 'samples'>('parts')
const expandedLendingId = ref<string | null>(null)

const availableOperators = computed(() => {
  const operators = new Set<string>()
  operators.add('陈经理')

  if (activeTab.value === 'parts') {
    for (const partId of store.batchSelection) {
      const ticket = store.afterSalesTickets.find(t =>
        t.parts.some(p => p.id === partId)
      )
      if (ticket) {
        operators.add(ticket.assignee)
      }
    }
    if (store.batchSelection.size === 0) {
      store.afterSalesTickets.forEach(t => operators.add(t.assignee))
    }
  } else {
    for (const lendingId of store.batchSelection) {
      const lending = store.sampleLendings.find(l => l.id === lendingId)
      if (lending) {
        operators.add(lending.lentBy)
      }
    }
    if (store.batchSelection.size === 0) {
      store.sampleLendings.forEach(l => operators.add(l.lentBy))
    }
  }

  return Array.from(operators).sort()
})

const selectedOperator = ref<string>('')

const unconfirmedParts = computed(() =>
  store.afterSalesTickets
    .filter(t => t.type === 'supplementary')
    .flatMap(t => t.parts.filter(p => !p.confirmed).map(p => ({ ...p, ticketId: t.id, ticketTitle: t.title, assignee: t.assignee })))
)

const unreturnedLendings = computed(() =>
  store.sampleLendings.filter(l => !l.returned)
)

const selectedPartIds = computed(() =>
  unconfirmedParts.value.filter(p => store.batchSelection.has(p.id)).map(p => p.id)
)

const selectedLendingIds = computed(() =>
  unreturnedLendings.value.filter(l => store.batchSelection.has(l.id)).map(l => l.id)
)

const allPartsSelected = computed(() =>
  unconfirmedParts.value.length > 0 && selectedPartIds.value.length === unconfirmedParts.value.length
)

const allLendingsSelected = computed(() =>
  unreturnedLendings.value.length > 0 && selectedLendingIds.value.length === unreturnedLendings.value.length
)

function toggleAllParts() {
  if (allPartsSelected.value) {
    unconfirmedParts.value.forEach(p => store.batchSelection.delete(p.id))
  } else {
    unconfirmedParts.value.forEach(p => store.batchSelection.add(p.id))
  }
}

function toggleAllLendings() {
  if (allLendingsSelected.value) {
    unreturnedLendings.value.forEach(l => store.batchSelection.delete(l.id))
  } else {
    unreturnedLendings.value.forEach(l => store.batchSelection.add(l.id))
  }
}

function toggleExpand(lendingId: string) {
  expandedLendingId.value = expandedLendingId.value === lendingId ? null : lendingId
}

function getOperatorForPart(part: { ticketId: string; assignee: string }): string {
  if (selectedOperator.value) return selectedOperator.value
  const ticket = store.afterSalesTickets.find(t => t.id === part.ticketId)
  if (ticket) return ticket.assignee
  return part.assignee
}

function getOperatorForLending(lending: { orderId: string; lentBy: string }): string {
  if (selectedOperator.value) return selectedOperator.value
  return lending.lentBy
}

function batchConfirmParts() {
  if (selectedPartIds.value.length === 0) return
  store.batchConfirmParts(selectedOperator.value || null)
}

function batchReturnSamples() {
  if (selectedLendingIds.value.length === 0) return
  store.batchReturnSamples(selectedOperator.value || null)
}
</script>

<template>
  <div class="batch-panel">
    <div class="panel-header">
      <h3>批量复核</h3>
      <span class="panel-hint">同一条工作面处理</span>
    </div>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'parts' }"
        @click="activeTab = 'parts'; store.clearBatchSelection(); selectedOperator = ''"
      >
        <span>补件确认</span>
        <span class="tab-count" v-if="unconfirmedParts.length > 0">{{ unconfirmedParts.length }}</span>
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'samples' }"
        @click="activeTab = 'samples'; store.clearBatchSelection(); selectedOperator = ''"
      >
        <span>样品回收</span>
        <span class="tab-count" v-if="unreturnedLendings.length > 0">{{ unreturnedLendings.length }}</span>
      </button>
    </div>

    <div class="panel-body">
      <template v-if="activeTab === 'parts'">
        <div class="operator-selector">
          <label class="operator-label">操作者</label>
          <select v-model="selectedOperator" class="operator-select">
            <option value="">按工单负责人自动分配</option>
            <option v-for="op in availableOperators" :key="op" :value="op">{{ op }}</option>
          </select>
        </div>

        <div class="batch-toolbar" v-if="unconfirmedParts.length > 0">
          <div class="select-all" @click="toggleAllParts">
            <div class="checkbox" :class="{ checked: allPartsSelected }"></div>
            <span>全选 ({{ selectedPartIds.length }}/{{ unconfirmedParts.length }})</span>
          </div>
          <button
            class="btn btn-primary btn-sm"
            :disabled="selectedPartIds.length === 0"
            @click="batchConfirmParts"
          >
            批量确认 ({{ selectedPartIds.length }})
          </button>
        </div>

        <div class="batch-list" v-if="unconfirmedParts.length > 0">
          <div
            v-for="part in unconfirmedParts"
            :key="part.id"
            class="batch-item"
            :class="{ selected: store.batchSelection.has(part.id) }"
          >
            <div class="batch-item-left" @click="store.toggleBatchSelect(part.id)">
              <div class="checkbox" :class="{ checked: store.batchSelection.has(part.id) }"></div>
            </div>
            <div class="batch-item-main">
              <div class="batch-item-title">{{ part.name }}</div>
              <div class="batch-item-meta">
                <span class="sku">{{ part.sku }}</span>
                <span class="qty">×{{ part.quantity }}</span>
              </div>
              <div class="batch-item-reason">{{ part.reason }}</div>
              <div class="batch-item-ticket">
                <span class="ticket-link">📋 {{ part.ticketTitle }}</span>
              </div>
              <div class="batch-item-assignee">
                <span class="assignee-label">负责人：</span>
                <span class="assignee-value">{{ part.assignee }}</span>
              </div>
            </div>
            <button
              class="btn btn-secondary btn-sm single-btn"
              @click.stop="store.confirmPart(part.id, getOperatorForPart(part))"
            >
              确认
            </button>
          </div>
        </div>

        <div v-else class="empty-batch">
          <div class="empty-icon">✓</div>
          <p>所有补件已确认</p>
        </div>
      </template>

      <template v-else>
        <div class="operator-selector">
          <label class="operator-label">操作者</label>
          <select v-model="selectedOperator" class="operator-select">
            <option value="">按样品借出方自动分配</option>
            <option v-for="op in availableOperators" :key="op" :value="op">{{ op }}</option>
          </select>
        </div>

        <div class="batch-toolbar" v-if="unreturnedLendings.length > 0">
          <div class="select-all" @click="toggleAllLendings">
            <div class="checkbox" :class="{ checked: allLendingsSelected }"></div>
            <span>全选 ({{ selectedLendingIds.length }}/{{ unreturnedLendings.length }})</span>
          </div>
          <button
            class="btn btn-primary btn-sm"
            :disabled="selectedLendingIds.length === 0"
            @click="batchReturnSamples"
          >
            批量登记归还 ({{ selectedLendingIds.length }})
          </button>
        </div>

        <div class="batch-list" v-if="unreturnedLendings.length > 0">
          <div
            v-for="lending in unreturnedLendings"
            :key="lending.id"
            class="batch-item"
            :class="{ selected: store.batchSelection.has(lending.id), overdue: lending.overdue }"
          >
            <div class="batch-item-left" @click="store.toggleBatchSelect(lending.id)">
              <div class="checkbox" :class="{ checked: store.batchSelection.has(lending.id) }"></div>
            </div>
            <div class="batch-item-main">
              <div class="batch-item-title-row">
                <div class="batch-item-title">{{ lending.itemName }}</div>
                <button class="expand-btn" @click.stop="toggleExpand(lending.id)">
                  {{ expandedLendingId === lending.id ? '收起' : '历史' }}
                </button>
              </div>
              <div class="batch-item-meta">
                <span class="sku">{{ lending.sku }}</span>
                <span v-if="lending.overdue" class="badge badge-red overdue-badge">逾期</span>
              </div>
              <div class="batch-item-reason">借给 {{ lending.lentTo }}</div>
              <div class="batch-item-ticket">
                <span class="ticket-link">借出 {{ lending.lentAt }} · 应还 {{ lending.expectedReturn }}</span>
              </div>
              <div class="batch-item-assignee">
                <span class="assignee-label">借出方：</span>
                <span class="assignee-value">{{ lending.lentBy }}</span>
              </div>

              <div v-if="expandedLendingId === lending.id && lending.history.length > 0" class="lending-history">
                <div class="history-title">操作记录</div>
                <div
                  v-for="(h, hidx) in lending.history"
                  :key="hidx"
                  class="history-item"
                >
                  <span class="history-action">{{ h.action }}</span>
                  <span class="history-at">{{ h.at }}</span>
                  <span class="history-by">{{ h.by }}</span>
                  <span class="history-detail">{{ h.detail }}</span>
                </div>
              </div>
            </div>
            <button
              class="btn btn-secondary btn-sm single-btn"
              @click.stop="store.returnSample(lending.id, getOperatorForLending(lending))"
            >
              登记归还
            </button>
          </div>
        </div>

        <div v-if="store.sampleLendings.filter(l => l.returned).length > 0" class="returned-section">
          <div class="returned-header">
            <span>已归还</span>
            <span class="returned-count">{{ store.sampleLendings.filter(l => l.returned).length }}</span>
          </div>
          <div class="returned-list">
            <div
              v-for="lending in store.sampleLendings.filter(l => l.returned)"
              :key="lending.id"
              class="returned-item"
            >
              <div class="returned-icon">✓</div>
              <div class="returned-main">
                <div class="returned-name-row">
                  <span class="returned-name">{{ lending.itemName }}</span>
                  <button
                    class="expand-btn expand-btn-sm"
                    @click="toggleExpand(lending.id)"
                  >
                    {{ expandedLendingId === lending.id ? '收起' : '历史' }}
                  </button>
                </div>
                <div class="returned-meta">
                  归还人 {{ lending.returnedBy }} · {{ lending.returnedAt }}
                </div>
                <div v-if="lending.returnNote" class="returned-note">{{ lending.returnNote }}</div>
                <div
                  v-if="expandedLendingId === lending.id && lending.history.length > 0"
                  class="lending-history"
                >
                  <div class="history-title">操作记录</div>
                  <div
                    v-for="(h, hidx) in lending.history"
                    :key="hidx"
                    class="history-item"
                  >
                    <span class="history-action">{{ h.action }}</span>
                    <span class="history-at">{{ h.at }}</span>
                    <span class="history-by">{{ h.by }}</span>
                    <span class="history-detail">{{ h.detail }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="unreturnedLendings.length === 0 && store.sampleLendings.filter(l => l.returned).length === 0" class="empty-batch">
          <div class="empty-icon">✓</div>
          <p>所有样品已归还</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.batch-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.panel-hint {
  font-size: 11px;
  color: #9ca3af;
}

.tabs {
  display: flex;
  padding: 8px 16px;
  gap: 4px;
  border-bottom: 1px solid #f3f4f6;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  transition: all 0.15s;
}

.tab:hover {
  background: #f3f4f6;
}

.tab.active {
  background: #6366f1;
  color: #ffffff;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.tab:not(.active) .tab-count {
  background: #e5e7eb;
  color: #6b7280;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.operator-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 12px;
}

.operator-label {
  font-size: 12px;
  font-weight: 500;
  color: #92400e;
  flex-shrink: 0;
}

.operator-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  font-size: 12px;
  background: #ffffff;
  color: #78350f;
  outline: none;
  cursor: pointer;
}

.operator-select:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.batch-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.15s;
}

.batch-item:hover {
  border-color: #c7d2fe;
}

.batch-item.selected {
  border-color: #6366f1;
  background: #f5f3ff;
}

.batch-item.overdue {
  border-left: 3px solid #ef4444;
}

.batch-item-left {
  padding-top: 2px;
  cursor: pointer;
}

.batch-item-main {
  flex: 1;
  min-width: 0;
}

.batch-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.batch-item-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.expand-btn {
  font-size: 10px;
  padding: 2px 6px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 4px;
  font-weight: 500;
}

.expand-btn:hover {
  background: #e0e7ff;
}

.expand-btn-sm {
  font-size: 10px;
  padding: 1px 5px;
  background: #dcfce7;
  color: #15803d;
}

.expand-btn-sm:hover {
  background: #bbf7d0;
}

.batch-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sku {
  font-size: 10px;
  color: #9ca3af;
  font-family: 'SF Mono', Menlo, monospace;
}

.qty {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.batch-item-reason {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
}

.batch-item-ticket {
  font-size: 10px;
  color: #9ca3af;
}

.ticket-link {
  color: #6366f1;
  font-weight: 500;
}

.batch-item-assignee {
  margin-top: 2px;
  font-size: 10px;
  color: #9ca3af;
}

.assignee-label {
  color: #9ca3af;
}

.assignee-value {
  color: #4b5563;
  font-weight: 500;
}

.lending-history {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.history-title {
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 4px;
  font-weight: 500;
}

.history-item {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 6px;
  padding: 2px 0;
  font-size: 10px;
}

.history-action {
  color: #6366f1;
  font-weight: 500;
}

.history-at {
  color: #9ca3af;
  font-family: 'SF Mono', Menlo, monospace;
}

.history-by {
  color: #6b7280;
}

.history-detail {
  color: #4b5563;
  flex: 1;
  min-width: 100%;
}

.overdue-badge {
  font-size: 9px;
}

.single-btn {
  flex-shrink: 0;
}

.empty-batch {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #d1fae5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 12px;
}

.empty-batch p {
  font-size: 13px;
  color: #6b7280;
}

.returned-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.returned-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.returned-count {
  background: #d1fae5;
  color: #059669;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.returned-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.returned-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
}

.returned-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 1px;
}

.returned-main {
  flex: 1;
  min-width: 0;
}

.returned-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.returned-name {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
}

.returned-meta {
  font-size: 10px;
  color: #6b7280;
  margin-top: 1px;
}

.returned-note {
  font-size: 10px;
  color: #059669;
  margin-top: 2px;
}
</style>