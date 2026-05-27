<template>
  <div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title">客户管理</div>
        <div class="list-filters">
          <input
            v-model="searchQuery"
            type="text"
            class="input"
            placeholder="搜索客户名称、联系人、电话..."
            style="width: 300px;"
          />
        </div>
      </div>
    </div>

    <div class="two-column">
      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">客户列表</div>
          <span style="font-size: 13px; color: var(--gray-500);">
            共 {{ filteredCustomers.length }} 位客户
          </span>
        </div>
        <div class="list-items">
          <div
            v-for="customer in filteredCustomers"
            :key="customer.id"
            class="list-item"
            :class="{ selected: selectedCustomer?.id === customer.id }"
            @click="selectCustomer(customer)"
          >
            <div class="list-item-title">
              <span>{{ customer.name }}</span>
              <span
                :class="['badge', customer.outstanding_buckets > customer.deposit_buckets ? 'badge-warning' : 'badge-success']"
              >
                欠桶 {{ customer.outstanding_buckets }}
              </span>
            </div>
            <div class="list-item-subtitle">
              联系人：{{ customer.contact }} · {{ customer.phone }}
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">💧 {{ customer.water_type }}</span>
              <span class="list-item-meta-item">💰 ¥{{ customer.price_per_bucket }}/桶</span>
              <span class="list-item-meta-item">🪣 押桶 {{ customer.deposit_buckets }}</span>
            </div>
          </div>
          <div v-if="filteredCustomers.length === 0" class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-text">未找到符合条件的客户</div>
          </div>
        </div>
      </div>

      <div class="detail-panel">
        <div v-if="selectedCustomer" class="detail-header">
          <div class="detail-title">{{ selectedCustomer.name }}</div>
          <div class="detail-subtitle">
            {{ selectedCustomer.water_type }} · ¥{{ selectedCustomer.price_per_bucket }}/桶
          </div>
        </div>
        <div v-else class="detail-header">
          <div class="detail-title">请选择客户</div>
          <div class="detail-subtitle">从左侧列表选择查看详情</div>
        </div>

        <div class="detail-body">
          <div v-if="selectedCustomer">
            <div class="detail-section">
              <div class="detail-section-title">基本信息</div>
              <div class="detail-grid">
                <div class="detail-item" style="grid-column: span 2;">
                  <div class="detail-item-label">地址</div>
                  <div class="detail-item-value">{{ selectedCustomer.address }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">联系人</div>
                  <div class="detail-item-value">{{ selectedCustomer.contact }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">联系电话</div>
                  <div class="detail-item-value">{{ selectedCustomer.phone }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">空桶对账</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                <div style="padding: 16px; background-color: var(--gray-50); border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">押桶数量</div>
                  <div style="font-size: 24px; font-weight: 700;">{{ selectedCustomer.deposit_buckets }}</div>
                </div>
                <div style="padding: 16px; background-color: var(--gray-50); border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">累计送水</div>
                  <div style="font-size: 24px; font-weight: 700;">{{ selectedCustomer.total_buckets_delivered }}</div>
                </div>
                <div style="padding: 16px; background-color: var(--gray-50); border-radius: 8px; text-align: center;">
                  <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 4px;">累计回收</div>
                  <div style="font-size: 24px; font-weight: 700;">{{ selectedCustomer.total_buckets_returned }}</div>
                </div>
              </div>
              <div style="margin-top: 16px; padding: 16px; background-color: #fef3c7; border-radius: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 14px; color: #92400e;">当前欠桶数量</span>
                  <span style="font-size: 28px; font-weight: 700; color: #92400e;">
                    {{ selectedCustomer.outstanding_buckets }} 个
                  </span>
                </div>
                <div style="font-size: 12px; color: #b45309; margin-top: 4px;">
                  {{ selectedCustomer.outstanding_buckets > selectedCustomer.deposit_buckets
                    ? `超出押桶 ${selectedCustomer.outstanding_buckets - selectedCustomer.deposit_buckets} 个，请及时回收`
                    : '在押桶额度范围内' }}
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">最近订单</div>
              <div v-if="customerOrders.length > 0">
                <div
                  v-for="order in customerOrders.slice(0, 5)"
                  :key="order.id"
                  style="padding: 12px; background-color: var(--gray-50); border-radius: 6px; margin-bottom: 8px;"
                >
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 14px; font-weight: 500;">{{ order.id }}</span>
                    <span :class="['badge', `badge-${STATUS_COLORS[order.status]}`]">
                      {{ STATUS_LABELS[order.status] }}
                    </span>
                  </div>
                  <div style="font-size: 13px; color: var(--gray-600); margin-top: 4px;">
                    {{ order.quantity }} 桶 · ¥{{ order.total_amount }} · {{ formatDate(order.created_at) }}
                  </div>
                </div>
              </div>
              <div v-else class="empty-state" style="padding: 30px 20px;">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">暂无订单记录</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="height: 100%;">
            <div class="empty-state-icon">👈</div>
            <div class="empty-state-text">选择左侧客户查看详情</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Customer, Order } from '~/types'
import { STATUS_LABELS, STATUS_COLORS } from '~/types'

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()

const customers = ref<Customer[]>([])
const selectedCustomer = ref<Customer | null>(null)
const customerOrders = ref<Order[]>([])
const searchQuery = ref('')

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const query = searchQuery.value.toLowerCase()
  return customers.value.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.contact.toLowerCase().includes(query) ||
    c.phone.includes(query) ||
    c.address.toLowerCase().includes(query)
  )
})

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const selectCustomer = async (customer: Customer) => {
  selectedCustomer.value = customer
  try {
    customerOrders.value = await $fetch<Order[]>(
      `${config.public.apiBase}/orders?customer_id=${customer.id}`
    )
    customerOrders.value.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.error('加载客户订单失败:', error)
  }
}

const loadCustomers = async () => {
  try {
    customers.value = await $fetch<Customer[]>(`${config.public.apiBase}/customers`)
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

onMounted(() => {
  loadCustomers()
})
</script>
