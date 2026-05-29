<template>
  <div class="customers-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <span>客户管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>新增客户
          </el-button>
        </div>
      </template>

      <el-table :data="customers" v-loading="loading">
        <el-table-column prop="name" label="客户名称" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="credit_limit" label="信用额度" width="130" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.credit_limit) }}</template>
        </el-table-column>
        <el-table-column prop="credit_used" label="已用额度" width="130" align="right">
          <template #default="{ row }">
            <el-progress :percentage="Math.round(row.credit_used / row.credit_limit * 100)" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column prop="available_credit" label="可用额度" width="130" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.available_credit) }}</template>
        </el-table-column>
        <el-table-column prop="credit_days" label="账期" width="80" align="center">
          <template #default="{ row }">{{ row.credit_days }}天</template>
        </el-table-column>
        <el-table-column prop="credit_status_display" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.credit_status)" size="small">{{ row.credit_status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewOrders(row)">查看订单</el-button>
            <el-button link type="primary" @click="editCustomer(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑客户' : '新增客户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="信用额度" prop="credit_limit">
          <el-input-number v-model="form.credit_limit" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="账期天数" prop="credit_days">
          <el-input-number v-model="form.credit_days" :min="0" :max="90" /> 天
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCustomers, createCustomer, updateCustomer } from '../api/endpoints'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()

const customers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = ref({
  name: '', contact: '', phone: '', address: '', credit_limit: 0, credit_days: 30
})

const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
}

const formatMoney = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })

const getStatusType = (status) => {
  const typeMap = { NORMAL: 'success', WARNING: 'warning', OVERDUE: 'danger', FROZEN: 'info' }
  return typeMap[status] || ''
}

const loadCustomers = async () => {
  loading.value = true
  customers.value = await getCustomers()
  loading.value = false
}

const showCreateDialog = () => {
  isEdit.value = false
  form.value = { name: '', contact: '', phone: '', address: '', credit_limit: 0, credit_days: 30 }
  dialogVisible.value = true
}

const editCustomer = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await updateCustomer(form.value.id, form.value)
    } else {
      await createCustomer(form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadCustomers()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

const viewOrders = (row) => {
  router.push(`/orders?customer_id=${row.id}`)
}

onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
