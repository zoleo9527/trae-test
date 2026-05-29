<template>
  <div class="orders-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <span>订单管理</span>
          <div>
            <el-button type="primary" @click="showCreateDialog" v-if="isBoss || isSales">
              <el-icon><Plus /></el-icon>新建询价
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 140px">
            <el-option label="询价中" value="INQUIRY" />
            <el-option label="询价已确认" value="INQUIRY_APPROVED" />
            <el-option label="已锁库" value="LOCKED" />
            <el-option label="已出库" value="DELIVERED" />
            <el-option label="已结算" value="SETTLED" />
            <el-option label="退货申请中" value="RETURN_REQUESTED" />
            <el-option label="部分回款" value="PAID_PARTIAL" />
            <el-option label="已结清" value="PAID" />
            <el-option label="已逾期" value="OVERDUE" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="filters.customer_id" clearable placeholder="全部客户" style="width: 160px" filterable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="filters.is_overdue" @change="loadOrders">只看逾期</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrders">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orders" v-loading="loading" @row-click="goToDetail">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="customer_name" label="客户名称" />
        <el-table-column prop="status_display" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sales_person_name" label="销售员" width="100" />
        <el-table-column prop="total_amount" label="金额" width="110" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.total_amount) }}</template>
        </el-table-column>
        <el-table-column prop="unpaid_amount" label="未回款" width="110" align="right">
          <template #default="{ row }">
            <span :class="{ 'overdue': row.is_overdue }">¥{{ formatMoney(row.unpaid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="到期日" width="110">
          <template #default="{ row }">
            <span v-if="row.is_overdue" class="overdue-badge">已逾期</span>
            <span v-else>{{ row.due_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="goToDetail(row)">详情</el-button>
            <el-button link type="success" @click.stop="handleAction(row)" v-if="canAct(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建询价单" width="700px">
      <el-form :model="newOrder" label-width="80px">
        <el-form-item label="客户">
          <el-select v-model="newOrder.customer_id" placeholder="选择客户" style="width: 100%">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="账期">
          <el-input-number v-model="newOrder.credit_days" :min="0" :max="90" /> 天
        </el-form-item>
        <el-form-item label="配件">
          <el-table :data="newOrder.items" border size="small">
            <el-table-column prop="part_name" label="配件名称" width="180">
              <template #default="{ row, $index }">
                <el-select v-model="row.part_id" placeholder="选择配件" style="width: 100%" size="small" @change="onPartChange($index)">
                  <el-option v-for="p in parts" :key="p.id" :label="`${p.part_code} ${p.name}`" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="spec" label="规格" width="120" />
            <el-table-column prop="unit_price" label="单价" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.unit_price" :min="0" size="small" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" size="small" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100" align="right">
              <template #default="{ row }">¥{{ (row.unit_price * row.quantity).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button size="small" style="margin-top: 10px" @click="addItem">
            <el-icon><Plus /></el-icon>添加配件
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOrder">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { getOrders, getCustomers, getParts, createInquiry } from '../api/endpoints'
import { Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isBoss = computed(() => authStore.isBoss)
const isSales = computed(() => authStore.isSales)
const isWarehouse = computed(() => authStore.isWarehouse)

const orders = ref([])
const customers = ref([])
const parts = ref([])
const loading = ref(false)
const createDialogVisible = ref(false)

const filters = ref({
  status: route.query.status || '',
  customer_id: route.query.customer_id || '',
  is_overdue: route.query.is_overdue === 'true'
})

const newOrder = ref({
  customer_id: null,
  credit_days: 30,
  items: [{ part_id: null, part_name: '', spec: '', unit_price: 0, quantity: 1 }]
})

const formatMoney = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
const formatDate = (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'

const getStatusType = (status) => {
  const typeMap = {
    INQUIRY: 'info', INQUIRY_APPROVED: '', LOCKED: 'warning', DELIVERED: '',
    SETTLED: 'primary', RETURN_REQUESTED: 'warning', PAID_PARTIAL: '',
    PAID: 'success', OVERDUE: 'danger', CANCELLED: 'info'
  }
  return typeMap[status] || ''
}

const canAct = (row) => {
  if (isBoss.value) return true
  if (isSales.value && ['INQUIRY', 'INQUIRY_APPROVED', 'SETTLED', 'PAID_PARTIAL', 'DELIVERED'].includes(row.status)) return true
  if (isWarehouse.value && ['INQUIRY_APPROVED', 'LOCKED'].includes(row.status)) return true
  return false
}

const loadOrders = async () => {
  loading.value = true
  try {
    const params = { ...filters.value }
    if (!params.status) delete params.status
    if (!params.customer_id) delete params.customer_id
    if (!params.is_overdue) delete params.is_overdue
    orders.value = await getOrders(params)
  } finally {
    loading.value = false
  }
}

const loadCustomers = async () => {
  customers.value = await getCustomers()
}

const loadParts = async () => {
  parts.value = await getParts()
}

const resetFilters = () => {
  filters.value = { status: '', customer_id: '', is_overdue: false }
  loadOrders()
}

const goToDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

const showCreateDialog = () => {
  newOrder.value = {
    customer_id: null,
    credit_days: 30,
    items: [{ part_id: null, part_name: '', spec: '', unit_price: 0, quantity: 1 }]
  }
  createDialogVisible.value = true
}

const addItem = () => {
  newOrder.value.items.push({ part_id: null, part_name: '', spec: '', unit_price: 0, quantity: 1 })
}

const removeItem = (index) => {
  newOrder.value.items.splice(index, 1)
}

const onPartChange = (index) => {
  const part = parts.value.find(p => p.id === newOrder.value.items[index].part_id)
  if (part) {
    newOrder.value.items[index].part_name = part.name
    newOrder.value.items[index].spec = part.spec
    newOrder.value.items[index].unit_price = part.sale_price
  }
}

const submitOrder = async () => {
  if (!newOrder.value.customer_id) {
    ElMessage.warning('请选择客户')
    return
  }
  const validItems = newOrder.value.items.filter(i => i.part_id && i.quantity > 0)
  if (validItems.length === 0) {
    ElMessage.warning('请添加配件')
    return
  }
  try {
    await createInquiry({
      customer_id: newOrder.value.customer_id,
      credit_days: newOrder.value.credit_days,
      items: validItems.map(i => ({ part_id: i.part_id, quantity: i.quantity, unit_price: i.unit_price }))
    })
    ElMessage.success('询价单创建成功')
    createDialogVisible.value = false
    loadOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '创建失败')
  }
}

const handleAction = (row) => {
  router.push(`/orders/${row.id}`)
}

onMounted(() => {
  loadOrders()
  loadCustomers()
  loadParts()
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

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.overdue-badge {
  color: #f56c6c;
  font-size: 12px;
  background: #fef0f0;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
