<template>
  <div class="payments-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <span>回款管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 140px" @change="loadPayments">
            <el-option label="待确认" value="PENDING" />
            <el-option label="已确认" value="CONFIRMED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="payments" v-loading="loading">
        <el-table-column prop="payment_no" label="回款编号" width="160" />
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="customer_name" label="客户" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="method_display" label="方式" width="100" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="登记人" width="100" />
        <el-table-column prop="confirm_person_name" label="确认人" width="100" />
        <el-table-column prop="created_at" label="登记时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" v-if="isBoss">
          <template #default="{ row }">
            <el-button link type="success" @click="handleConfirmPayment(row)" v-if="row.status === 'PENDING'">确认</el-button>
            <el-button link type="danger" @click="handleRejectPayment(row)" v-if="row.status === 'PENDING'">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { getPayments, confirmPayment as apiConfirmPayment, rejectPayment as apiRejectPayment } from '../api/endpoints'

const authStore = useAuthStore()
const isBoss = computed(() => authStore.isBoss)

const payments = ref([])
const loading = ref(false)
const filters = ref({ status: '' })

const formatMoney = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
const formatDate = (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'

const getStatusType = (status) => {
  const typeMap = { PENDING: 'warning', CONFIRMED: 'success', REJECTED: 'danger' }
  return typeMap[status] || ''
}

const loadPayments = async () => {
  loading.value = true
  const params = { ...filters.value }
  if (!params.status) delete params.status
  payments.value = await getPayments(params)
  loading.value = false
}

const resetFilters = () => {
  filters.value = { status: '' }
  loadPayments()
}

const handleConfirmPayment = async (row) => {
  try {
    await ElMessageBox.confirm(`确认回款 ¥${formatMoney(row.amount)}？`, '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await apiConfirmPayment(row.id, '')
    ElMessage.success('已确认')
    loadPayments()
  } catch {}
}

const handleRejectPayment = async (row) => {
  try {
    await ElMessageBox.confirm('确定驳回该回款？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await apiRejectPayment(row.id, '')
    ElMessage.success('已驳回')
    loadPayments()
  } catch {}
}

onMounted(() => {
  loadPayments()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 20px;
}

.amount {
  font-weight: 500;
  color: #67c23a;
}
</style>
