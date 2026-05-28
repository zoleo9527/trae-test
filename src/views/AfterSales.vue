<template>
  <div class="aftersales-page">
    <div class="page-header">
      <h2 class="page-title">售后处理</h2>
      <p class="page-desc">售后补单与退款统一处理，责任链全程追溯</p>
    </div>

    <div class="filter-bar card">
      <div class="filter-item">
        <label>售后类型</label>
        <select v-model="typeFilter" class="select">
          <option value="all">全部</option>
          <option value="reorder">补单</option>
          <option value="refund">退款</option>
        </select>
      </div>
      <div class="filter-item">
        <label>处理状态</label>
        <select v-model="statusFilter" class="select">
          <option value="all">全部</option>
          <option value="pending">待审核</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
      <div class="filter-item">
        <label>快捷筛选</label>
        <select v-model="quickFilter" class="select">
          <option value="all">全部</option>
          <option value="my">我处理的</option>
          <option value="pending">待我处理</option>
        </select>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>类型</th>
            <th>原因</th>
            <th>金额</th>
            <th>状态</th>
            <th>申请人</th>
            <th>申请时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredAfterSales" :key="item.id">
            <td>
              <span class="order-no text-link" @click="goToOrder(item.orderId)">
                {{ item.orderNo }}
              </span>
            </td>
            <td>{{ item.customer }}</td>
            <td>
              <span class="tag" :class="item.type === 'refund' ? 'tag-error' : 'tag-primary'">
                {{ item.type === 'refund' ? '退款' : '补单' }}
              </span>
            </td>
            <td class="reason-cell">{{ item.reason }}</td>
            <td>¥{{ item.amount.toLocaleString() }}</td>
            <td>
              <span class="tag" :class="'tag-' + statusConfig[item.status].type">
                {{ statusConfig[item.status].label }}
              </span>
            </td>
            <td>{{ item.createdBy }}</td>
            <td>{{ formatTime(item.createdAt) }}</td>
            <td>
              <button class="btn btn-default btn-sm" @click="goToOrder(item.orderId)">
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
import dayjs from 'dayjs'

const router = useRouter()
const appStore = useAppStore()
const { orders, currentUser, currentRole } = storeToRefs(appStore)

const typeFilter = ref('all')
const statusFilter = ref('all')
const quickFilter = ref('all')

const statusConfig = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已审核', type: 'primary' },
  processing: { label: '处理中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  rejected: { label: '已拒绝', type: 'error' }
}

const allAfterSales = computed(() => {
  const list = []
  orders.value.forEach(order => {
    if (order.afterSales && order.afterSales.length > 0) {
      order.afterSales.forEach(as => {
        list.push({
          ...as,
          orderId: order.id,
          orderNo: order.orderNo,
          customer: order.customer,
          productName: order.productName
        })
      })
    }
  })
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const filteredAfterSales = computed(() => {
  let list = allAfterSales.value

  if (typeFilter.value !== 'all') {
    list = list.filter(item => item.type === typeFilter.value)
  }

  if (statusFilter.value !== 'all') {
    list = list.filter(item => item.status === statusFilter.value)
  }

  if (quickFilter.value === 'my') {
    list = list.filter(item =>
      item.logs.some(log => log.operator === currentUser.value.name)
    )
  } else if (quickFilter.value === 'pending') {
    list = list.filter(item => {
      if (currentRole.value === 'sample') {
        if (item.status === 'pending') return true
        if (item.type === 'refund' && (item.status === 'approved' || item.status === 'processing')) return true
      }
      if (currentRole.value === 'warehouse') {
        if (item.type === 'reorder' && (item.status === 'approved' || item.status === 'processing')) return true
      }
      return false
    })
  }

  return list
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function goToOrder(orderId) {
  router.push(`/order/${orderId}`)
}
</script>

<style scoped>
.aftersales-page {
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

.reason-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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