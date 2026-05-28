<template>
  <div class="orders-page">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">订单列表</h2>
        <p class="page-desc">共 {{ filteredOrders.length }} 条订单记录</p>
      </div>
      <div class="header-actions flex gap-sm">
        <input
          v-model="searchKeyword"
          type="text"
          class="input"
          placeholder="搜索订单号、客户、产品..."
          style="width: 280px"
        />
        <select v-model="statusFilter" class="select">
          <option value="all">全部状态</option>
          <option value="production">生产中</option>
          <option value="partial_shipped">部分发货</option>
          <option value="shipped">已发货</option>
          <option value="after_sale">售后中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>产品</th>
            <th>数量</th>
            <th>金额</th>
            <th>版本</th>
            <th>状态</th>
            <th>售后</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in displayOrders" :key="order.id">
            <td>
              <span class="order-no text-link" @click="goToDetail(order.id)">
                {{ order.orderNo }}
              </span>
            </td>
            <td>{{ order.customer }}</td>
            <td>{{ order.productName }}</td>
            <td>{{ order.quantity }}</td>
            <td>¥{{ order.amount.toLocaleString() }}</td>
            <td><span class="tag tag-default">{{ order.sampleVersion }}</span></td>
            <td>
              <span class="tag" :class="'tag-' + statusConfig[order.status].type">
                {{ statusConfig[order.status].label }}
              </span>
            </td>
            <td>
              <span v-if="order.afterSales && order.afterSales.length > 0"
                    class="tag tag-warning">
                {{ order.afterSales.filter(a => a.status !== 'completed').length }} 处理中
              </span>
              <span v-else class="text-light">-</span>
            </td>
            <td>
              <button class="btn btn-default btn-sm" @click="goToDetail(order.id)">
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'

const router = useRouter()
const appStore = useAppStore()
const { filteredOrders, searchKeyword } = storeToRefs(appStore)

const statusFilter = ref('all')

const statusConfig = {
  production: { label: '生产中', type: 'primary' },
  partial_shipped: { label: '部分发货', type: 'warning' },
  shipped: { label: '已发货', type: 'default' },
  after_sale: { label: '售后中', type: 'error' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'default' }
}

const displayOrders = computed(() => {
  let orders = filteredOrders.value
  if (statusFilter.value !== 'all') {
    orders = orders.filter(o => o.status === statusFilter.value)
  }
  return orders
})

function goToDetail(orderId) {
  router.push(`/order/${orderId}`)
}
</script>

<style scoped>
.orders-page {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.order-no {
  font-family: monospace;
  font-weight: 500;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}
</style>