<template>
  <div class="page-container">
    <div class="page-header">
      <h2>安装预约</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建预约
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 140px;" @change="loadData">
          <el-option v-for="(item, key) in appointmentStatusMap" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px;" @change="loadData" />
      </div>

      <el-table :data="list" stripe>
        <el-table-column label="预约日期" width="120">
          <template #default="{ row }">{{ row.appointmentDate }}</template>
        </el-table-column>
        <el-table-column prop="timeSlot" label="时间段" width="120" />
        <el-table-column label="客户" width="150">
          <template #default="{ row }">{{ row.order?.customer?.name }}</template>
        </el-table-column>
        <el-table-column label="联系电话" width="130">
          <template #default="{ row }">{{ row.order?.customer?.phone }}</template>
        </el-table-column>
        <el-table-column label="安装地址" min-width="200">
          <template #default="{ row }">{{ row.order?.customer?.address }}</template>
        </el-table-column>
        <el-table-column prop="installerName" label="安装师傅" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="goToOrder(row.orderId)">订单详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="success" text @click="confirmAppointment(row.id)">确认</el-button>
            <el-button v-if="row.status === 'confirmed'" size="small" type="warning" text @click="startAppointment(row.id)">开始</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { installationApi } from '@/api'
import { appointmentStatusMap } from '@/utils/constants'

const router = useRouter()
const list = ref<any[]>([])
const statusFilter = ref('')
const dateRange = ref<any[]>([])
const showCreateDialog = ref(false)

function statusType(status: string) { return appointmentStatusMap[status]?.type || 'info' }
function statusLabel(status: string) { return appointmentStatusMap[status]?.label || status }

async function loadData() {
  const params: any = { pageSize: 100 }
  if (statusFilter.value) params.status = statusFilter.value
  if (dateRange.value?.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  const res = await installationApi.getList(params)
  list.value = res.items || []
}

async function confirmAppointment(id: number) {
  await installationApi.update(id, { status: 'confirmed' })
  ElMessage.success('预约已确认')
  loadData()
}

async function startAppointment(id: number) {
  await installationApi.start(id)
  ElMessage.success('已开始安装')
  loadData()
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
