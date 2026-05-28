<template>
  <div class="orders-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📋 兑换订单</span>
          <div class="header-actions">
            <el-radio-group v-model="filterStatus" size="small">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="pending">待确认</el-radio-button>
              <el-radio-button value="confirmed">已确认</el-radio-button>
              <el-radio-button value="shipped">已发货</el-radio-button>
              <el-radio-button value="delivered">待核销</el-radio-button>
              <el-radio-button value="abnormal">异常</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table :data="filteredOrders">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="商品" width="200">
          <template #default="{ row }">
            <span>{{ row.productImage }} {{ row.productName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="100" />
        <el-table-column prop="totalPoints" label="积分" width="100" />
        <el-table-column prop="storeName" label="门店" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="异常" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isAbnormal" type="danger" size="small">是</el-tag>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="当前处理" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getRoleType(row.currentHandler)">
              {{ getRoleLabel(row.currentHandler) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="goToDetail(row.id)">
              详情
            </el-button>
            <el-button 
              v-if="canHandle(row)" 
              type="success" 
              size="small" 
              link 
              @click="handleAction(row)"
            >
              {{ getActionText(row) }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore, useOrderStore } from '@/stores'
import { ExchangeOrderStatusLabels, UserRole, type ExchangeOrder } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const filterStatus = ref('')

const filteredOrders = computed(() => {
  let orders = orderStore.orders
  
  if (filterStatus.value === 'abnormal') {
    return orders.filter(o => o.isAbnormal)
  }
  
  if (filterStatus.value) {
    orders = orders.filter(o => o.status === filterStatus.value)
  }
  
  return orders
})

const getStatusLabel = (status: string) => {
  return ExchangeOrderStatusLabels[status as keyof typeof ExchangeOrderStatusLabels] || status
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'pending': 'warning',
    'confirmed': 'primary',
    'shipped': 'info',
    'delivered': 'success',
    'verified': 'success',
    'cancelled': 'danger',
    'expired': 'info'
  }
  return types[status] || 'info'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'store_manager': '店长',
    'planner': '企划',
    'warehouse': '仓管'
  }
  return labels[role] || role
}

const getRoleType = (role: string) => {
  const types: Record<string, string> = {
    'store_manager': 'primary',
    'planner': 'success',
    'warehouse': 'warning'
  }
  return types[role] || 'info'
}

const canHandle = (order: ExchangeOrder) => {
  const user = authStore.currentUser
  if (!user) return false
  
  if (order.isAbnormal && user.role !== UserRole.PLANNER) return false
  
  if (user.role === UserRole.WAREHOUSE) {
    return order.status === 'confirmed'
  }
  
  if (user.role === UserRole.STORE_MANAGER) {
    return (order.status === 'pending' || order.status === 'delivered') && 
           order.storeId === user.storeId
  }
  
  return false
}

const getActionText = (order: ExchangeOrder) => {
  if (order.status === 'pending') return '确认订单'
  if (order.status === 'confirmed') return '发货'
  if (order.status === 'delivered') return '核销'
  return '处理'
}

const handleAction = (order: ExchangeOrder) => {
  const user = authStore.currentUser
  if (!user) return
  
  if (order.status === 'pending') {
    orderStore.confirmOrder(order.id, user)
    ElMessage.success('订单已确认')
  } else if (order.status === 'confirmed') {
    orderStore.shipOrder(order.id, user)
    ElMessage.success('已发货')
  } else if (order.status === 'delivered') {
    goToDetail(order.id)
  }
}

const goToDetail = (id: string) => {
  router.push(`/orders/${id}`)
}
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
