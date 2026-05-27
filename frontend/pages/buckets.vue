<template>
  <div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title">空桶对账</div>
        <div class="list-filters">
          <select v-model="customerFilter" class="input" style="width: 200px;">
            <option value="">全部客户</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">{{ totalDelivered }}</div>
        <div class="stat-label">本期送水桶数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-value">{{ totalReturned }}</div>
        <div class="stat-label">本期回收空桶</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value" style="color: var(--warning);">{{ totalOutstanding }}</div>
        <div class="stat-label">客户欠桶总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏠</div>
        <div class="stat-value" style="color: var(--success);">{{ totalDeposits }}</div>
        <div class="stat-label">客户押桶总数</div>
      </div>
    </div>

    <div class="two-column">
      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">交易流水</div>
          <span style="font-size: 13px; color: var(--gray-500);">
            共 {{ filteredTransactions.length }} 条记录
          </span>
        </div>
        <div class="list-items">
          <div
            v-for="trans in filteredTransactions"
            :key="trans.id"
            class="list-item"
          >
            <div class="list-item-title">
              <span>
                {{ trans.type === 'delivery' ? '💧 送水' : '🪣 回收' }} · {{ trans.customer_name }}
              </span>
              <span
                :class="[
                  'badge',
                  trans.type === 'delivery' ? 'badge-info' : 'badge-success'
                ]"
              >
                {{ trans.type === 'delivery' ? `+${trans.buckets_change}桶` : `${trans.buckets_change}桶` }}
              </span>
            </div>
            <div class="list-item-subtitle">
              操作人：{{ trans.operator }} · {{ formatTime(trans.created_at) }}
            </div>
            <div v-if="trans.note" class="list-item-subtitle" style="color: var(--gray-600);">
              {{ trans.note }}
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">
                变动前：{{ trans.balance_before }}
              </span>
              <span class="list-item-meta-item">
                →
              </span>
              <span class="list-item-meta-item">
                变动后：{{ trans.balance_after }}
              </span>
            </div>
          </div>
          <div v-if="filteredTransactions.length === 0" class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">暂无交易记录</div>
          </div>
        </div>
      </div>

      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">客户欠桶统计</div>
          <span style="font-size: 13px; color: var(--gray-500);">
            共 {{ customers.length }} 位客户
          </span>
        </div>
        <div class="list-items">
          <div
            v-for="customer in customersSortedByOutstanding"
            :key="customer.id"
            class="list-item"
          >
            <div class="list-item-title">
              <span>{{ customer.name }}</span>
              <span
                :class="[
                  'badge',
                  customer.outstanding_buckets > customer.deposit_buckets ? 'badge-danger' : 'badge-warning'
                ]"
              >
                欠桶 {{ customer.outstanding_buckets }}
              </span>
            </div>
            <div class="list-item-subtitle">
              押桶 {{ customer.deposit_buckets }} 个 · 
              <span
                :style="{
                  color: customer.outstanding_buckets > customer.deposit_buckets ? 'var(--danger)' : 'var(--success)'
                }"
              >
                {{ customer.outstanding_buckets > customer.deposit_buckets
                  ? `超出押桶 ${customer.outstanding_buckets - customer.deposit_buckets} 个`
                  : `可用额度 ${customer.deposit_buckets - customer.outstanding_buckets} 个` }}
              </span>
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">
                累计送水：{{ customer.total_buckets_delivered }} 桶
              </span>
              <span class="list-item-meta-item">
                累计回收：{{ customer.total_buckets_returned }} 桶
              </span>
            </div>
            <div style="margin-top: 8px;">
              <div class="progress-bar">
                <div
                  class="progress-bar-fill"
                  :class="{
                    success: customer.outstanding_buckets <= customer.deposit_buckets,
                    warning: customer.outstanding_buckets > customer.deposit_buckets
                  }"
                  :style="{
                    width: `${customer.deposit_buckets > 0
                      ? Math.min((customer.outstanding_buckets / customer.deposit_buckets) * 100, 100)
                      : 0}%`
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BucketTransaction, Customer } from '~/types'

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()

const transactions = ref<BucketTransaction[]>([])
const customers = ref<Customer[]>([])
const customerFilter = ref('')

const filteredTransactions = computed(() => {
  let result = [...transactions.value]
  if (customerFilter.value) {
    result = result.filter(t => t.customer_id === customerFilter.value)
  }
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const customersSortedByOutstanding = computed(() => {
  return [...customers.value].sort((a, b) => {
    const aOver = a.outstanding_buckets - a.deposit_buckets
    const bOver = b.outstanding_buckets - b.deposit_buckets
    return bOver - aOver
  })
})

const totalDelivered = computed(() => {
  return transactions.value
    .filter(t => t.type === 'delivery')
    .reduce((sum, t) => sum + t.buckets_change, 0)
})

const totalReturned = computed(() => {
  return Math.abs(transactions.value
    .filter(t => t.type === 'return')
    .reduce((sum, t) => sum + t.buckets_change, 0))
})

const totalOutstanding = computed(() => {
  return customers.value.reduce((sum, c) => sum + c.outstanding_buckets, 0)
})

const totalDeposits = computed(() => {
  return customers.value.reduce((sum, c) => sum + c.deposit_buckets, 0)
})

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timeStr
  }
}

const loadData = async () => {
  try {
    const [transData, custData] = await Promise.all([
      $fetch<BucketTransaction[]>(`${config.public.apiBase}/bucket-transactions`),
      $fetch<Customer[]>(`${config.public.apiBase}/customers`)
    ])
    transactions.value = transData
    customers.value = custData
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>
