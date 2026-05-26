<template>
  <div class="page-container">
    <div class="page-header">
      <h2>验收回单</h2>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 140px;" @change="loadData">
          <el-option v-for="(item, key) in acceptanceStatusMap" :key="key" :label="item.label" :value="key" />
        </el-select>
      </div>

      <el-table :data="list" stripe>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="客户" width="150">
          <template #default="{ row }">{{ row.order?.customer?.name }}</template>
        </el-table-column>
        <el-table-column label="订单号" width="160">
          <template #default="{ row }">{{ row.order?.orderNo }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="整体评价" min-width="180">
          <template #default="{ row }">{{ row.overallEvaluation || '-' }}</template>
        </el-table-column>
        <el-table-column prop="satisfactionScore" label="满意度" width="100">
          <template #default="{ row }">
            <el-rate v-if="row.satisfactionScore" :model-value="row.satisfactionScore" disabled size="small" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="inspectorName" label="验收人" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="goToOrder(row.orderId)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { acceptanceApi } from '@/api'
import { acceptanceStatusMap, formatDateTime } from '@/utils/constants'

const router = useRouter()
const list = ref<any[]>([])
const statusFilter = ref('')

function statusType(status: string) { return acceptanceStatusMap[status]?.type || 'info' }
function statusLabel(status: string) { return acceptanceStatusMap[status]?.label || status }

async function loadData() {
  const params: any = { pageSize: 100 }
  if (statusFilter.value) params.status = statusFilter.value
  const res = await acceptanceApi.getList(params)
  list.value = res.items || []
}

function goToOrder(orderId: number) {
  router.push(`/orders/${orderId}`)
}

onMounted(() => loadData())
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h2 { margin: 0; }
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
