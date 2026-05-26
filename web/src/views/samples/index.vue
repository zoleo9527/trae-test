<template>
  <div class="page-container">
    <div class="page-header">
      <h2>样品管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        登记借出
      </el-button>
    </div>

    <el-alert v-if="overdueCount > 0" :title="`有 ${overdueCount} 笔样品逾期未还，请及时跟进`" type="warning" :closable="false" style="margin-bottom: 16px;">
      <template #default>
        <el-button type="warning" size="small" @click="statusFilter = 'overdue'">查看逾期</el-button>
      </template>
    </el-alert>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 140px;" @change="loadData">
          <el-option v-for="(item, key) in sampleStatusMap" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-input v-model="customerFilter" placeholder="客户姓名" clearable style="width: 140px;" @input="loadData" />
      </div>

      <el-table :data="list" stripe>
        <el-table-column label="借出日期" width="120">
          <template #default="{ row }">{{ row.borrowDate }}</template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" width="120" />
        <el-table-column prop="customerPhone" label="联系电话" width="130" />
        <el-table-column prop="productName" label="样品名称" width="180" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="预计归还" width="120">
          <template #default="{ row }">{{ row.expectedReturnDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="实际归还" width="120">
          <template #default="{ row }">{{ row.actualReturnDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            <el-tag v-if="row.status === 'borrowed' && isOverdue(row.expectedReturnDate)" type="danger" size="small" style="margin-left: 4px;">
              逾期{{ daysOverdue(row.expectedReturnDate) }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="depositAmount" label="押金" width="100">
          <template #default="{ row }">¥{{ row.depositAmount || 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'borrowed' || row.status === 'overdue'" size="small" type="warning" text @click="remindSample(row.id)">催还</el-button>
            <el-button v-if="row.status === 'borrowed' || row.status === 'overdue'" size="small" type="success" text @click="markReturned(row.id)">标记归还</el-button>
            <el-button size="small" type="primary" text @click="goToOrder(row.orderId)" v-if="row.orderId">关联订单</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="登记样品借出" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户姓名">
          <el-input v-model="form.customerName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.customerPhone" />
        </el-form-item>
        <el-form-item label="样品名称">
          <el-input v-model="form.productName" />
        </el-form-item>
        <el-form-item label="产品ID">
          <el-input v-model="form.productId" type="number" />
        </el-form-item>
        <el-form-item label="借出日期">
          <el-date-picker v-model="form.borrowDate" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="预计归还">
          <el-date-picker v-model="form.expectedReturnDate" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="押金">
          <el-input v-model="form.depositAmount" type="number" />
        </el-form-item>
        <el-form-item label="用途">
          <el-input v-model="form.purpose" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createSample">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sampleApi } from '@/api'
import { sampleStatusMap } from '@/utils/constants'

const router = useRouter()
const list = ref<any[]>([])
const statusFilter = ref('')
const customerFilter = ref('')
const showCreateDialog = ref(false)
const overdueCount = ref(0)

const form = ref({
  orderId: null as number | null,
  customerName: '',
  customerPhone: '',
  productId: null as number | null,
  productName: '',
  quantity: 1,
  borrowDate: '',
  expectedReturnDate: '',
  purpose: '',
  depositAmount: 0,
  handledBy: '',
})

function statusType(status: string) { return sampleStatusMap[status]?.type || 'info' }
function statusLabel(status: string) { return sampleStatusMap[status]?.label || status }

function isOverdue(date: string) {
  if (!date) return false
  return new Date(date) < new Date()
}

function daysOverdue(date: string) {
  if (!date) return 0
  const diff = Date.now() - new Date(date).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

async function loadData() {
  const params: any = { pageSize: 100 }
  if (statusFilter.value) params.status = statusFilter.value
  if (customerFilter.value) params.customerName = customerFilter.value
  const res = await sampleApi.getList(params)
  list.value = res.items || []
  overdueCount.value = list.value.filter(s => s.status === 'overdue').length
}

async function remindSample(id: number) {
  await sampleApi.remind(id, '请尽快归还样品，以免影响其他客户选型')
  ElMessage.success('催还提醒已发送')
  loadData()
}

async function markReturned(id: number) {
  await sampleApi.update(id, { status: 'returned', actualReturnDate: new Date().toISOString().split('T')[0] })
  ElMessage.success('已标记归还')
  loadData()
}

async function createSample() {
  await sampleApi.create(form.value)
  ElMessage.success('登记成功')
  showCreateDialog.value = false
  loadData()
}

function goToOrder(orderId: number) {
  if (orderId) router.push(`/orders/${orderId}`)
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
