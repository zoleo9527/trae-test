<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>订单管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建订单
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="keyword" placeholder="搜索订单号/客户名/电话" clearable style="width: 240px;" @input="loadOrders" />
        <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 140px;" @change="loadOrders">
          <el-option v-for="(item, key) in orderStatusMap" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-select v-model="salesFilter" placeholder="销售顾问" clearable style="width: 140px;" @change="loadOrders">
          <el-option label="小林" value="销售顾问-小林" />
          <el-option label="小周" value="销售顾问-小周" />
          <el-option label="小吴" value="销售顾问-小吴" />
        </el-select>
      </div>

      <el-table :data="orders" stripe @row-click="goToDetail">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="客户信息" width="200">
          <template #default="{ row }">
            <div>{{ row.customer?.name }}</div>
            <div style="font-size: 12px; color: #909399;">{{ row.customer?.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusType(row.status)">{{ orderStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="salesConsultant" label="销售" width="120" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="item in row.items?.slice(0, 2)" :key="item.id" size="small" style="margin-right: 4px;">
              {{ item.productName }} x{{ item.quantity }}
            </el-tag>
            <span v-if="row.items?.length > 2" style="font-size: 12px; color: #909399;">等{{ row.items.length }}件</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click.stop="goToDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        style="margin-top: 16px; justify-content: flex-end; display: flex;"
        @current-change="loadOrders"
        @size-change="loadOrders"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi } from '@/api'
import { orderStatusMap, formatDateTime } from '@/utils/constants'

const router = useRouter()
const orders = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const statusFilter = ref('')
const salesFilter = ref('')
const showCreateDialog = ref(false)

function orderStatusType(status: string) {
  return orderStatusMap[status]?.type || 'info'
}

function orderStatusLabel(status: string) {
  return orderStatusMap[status]?.label || status
}

async function loadOrders() {
  try {
    const res = await orderApi.getList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value || undefined,
      salesConsultant: salesFilter.value || undefined,
    })
    orders.value = res.items || []
    total.value = res.total || 0
  } catch (e) {}
}

function goToDetail(id: number) {
  router.push(`/orders/${id}`)
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    margin: 0;
  }
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
