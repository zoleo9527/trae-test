<template>
  <div class="order-detail" v-if="order">
    <el-page-header @back="$router.back()" :title="`订单详情 - ${order.order_no}`" />

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag :type="getStatusType(order.status)" size="large">{{ order.status_display }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户名称">{{ order.customer_name }}</el-descriptions-item>
            <el-descriptions-item label="销售员">{{ order.sales_person_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="库管员">{{ order.warehouse_person_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="账期">{{ order.credit_days }} 天</el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="amount-primary">¥{{ formatMoney(order.total_amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="已回款">
              <span class="amount-success">¥{{ formatMoney(order.paid_amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="未回款" v-if="order.unpaid_amount > 0">
              <span :class="order.is_overdue ? 'amount-danger' : 'amount-warning'">
                ¥{{ formatMoney(order.unpaid_amount) }}
                <el-tag v-if="order.is_overdue" type="danger" size="small" style="margin-left: 8px;">已逾期</el-tag>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="到期日">{{ order.due_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ formatDate(order.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header><span>商品明细</span></template>
          <el-table :data="order.items">
            <el-table-column prop="part_code" label="配件编码" width="120" />
            <el-table-column prop="part_name" label="配件名称" />
            <el-table-column prop="spec" label="规格" width="140" />
            <el-table-column prop="unit_price" label="单价" width="100" align="right" />
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="subtotal" label="小计" width="100" align="right" />
            <el-table-column label="退货" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.return_quantity > 0" class="return-tag">
                  已退 {{ row.return_quantity }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>流程追踪</span>
          </template>
          <el-steps direction="vertical" :active="currentStep" finish-status="success">
            <el-step v-for="(step, index) in workflowSteps" :key="index" :title="step.title" :description="step.description">
              <template #icon v-if="step.status">
                <el-tag size="small" :type="step.type">{{ step.statusText }}</el-tag>
              </template>
            </el-step>
          </el-steps>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>操作</span></template>
          <div class="action-buttons">
            <el-button type="primary" @click="handleApproveInquiry" v-if="showApproveInquiry" style="width: 100%">
              确认询价
            </el-button>
            <el-button type="warning" @click="handleLockStock" v-if="showLockStock" style="width: 100%">
              锁库
            </el-button>
            <el-button type="success" @click="handleDeliver" v-if="showDeliver" style="width: 100%">
              出库
            </el-button>
            <el-button type="primary" @click="handleSettle" v-if="showSettle" style="width: 100%">
              结算
            </el-button>
            <el-button type="warning" @click="showReturnDialog = true" v-if="showReturnRequest" style="width: 100%">
              申请退货
            </el-button>
            <el-button type="success" @click="handleApproveReturn" v-if="showApproveReturn" style="width: 100%">
              批准退货
            </el-button>
            <el-button type="danger" @click="handleRejectReturn" v-if="showRejectReturn" style="width: 100%">
              驳回退货
            </el-button>
            <el-button @click="showPaymentDialog = true" v-if="showPayment" style="width: 100%">
              登记回款
            </el-button>
            <el-button type="danger" @click="showReminderDialog = true" v-if="showReminder" style="width: 100%">
              创建催办
            </el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header><span>备注</span></template>
          <div class="remark-input">
            <el-input v-model="newRemark" type="textarea" :rows="3" placeholder="添加备注..." />
            <div style="margin-top: 10px; text-align: right;">
              <el-checkbox v-model="isInternalRemark">内部备注</el-checkbox>
              <el-button type="primary" size="small" @click="addRemark" :disabled="!newRemark">
                发送
              </el-button>
            </div>
          </div>
          <div class="remark-list">
            <div v-for="(remark, index) in order.remarks" :key="remark.id" class="remark-item">
              <div class="remark-header">
                <span class="remark-author">{{ remark.author_name }}</span>
                <el-tag v-if="remark.is_internal" type="info" size="small">内部</el-tag>
                <span class="remark-time">{{ formatDate(remark.created_at) }}</span>
              </div>
              <div class="remark-content">{{ remark.content }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showReturnDialog" title="申请退货" width="500px">
      <el-form :model="returnForm" label-width="80px">
        <el-form-item v-for="item in order.items.filter(i => i.quantity > i.return_quantity)" :key="item.id" :label="item.part_name">
          <el-input-number v-model="returnForm[item.id]" :min="0" :max="item.quantity - item.return_quantity" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="returnReason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReturn">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPaymentDialog" title="登记回款" width="400px">
      <el-form :model="paymentForm" label-width="80px">
        <el-form-item label="金额">
          <el-input-number v-model="paymentForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="方式">
          <el-select v-model="paymentForm.method" style="width: 100%">
            <el-option label="银行转账" value="BANK" />
            <el-option label="微信" value="WECHAT" />
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="现金" value="CASH" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPaymentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPayment">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReminderDialog" title="创建催办" width="500px">
      <el-form :model="reminderForm" label-width="80px">
        <el-form-item label="责任人">
          <el-select v-model="reminderForm.assignee_id" style="width: 100%">
            <el-option v-for="sales in salesList" :key="sales.id" :label="`${sales.first_name}${sales.last_name}`" :value="sales.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="reminderForm.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="reminderForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="reminderForm.priority">
            <el-radio value="LOW">低</el-radio>
            <el-radio value="MEDIUM">中</el-radio>
            <el-radio value="HIGH">高</el-radio>
            <el-radio value="URGENT">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReminderDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReminder">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { getOrder, addOrderRemark, approveInquiry, lockStock, deliverOrder, settleOrder,
  requestReturn, approveReturn, rejectReturn, createPayment, createReminder, getSalesList } from '../api/endpoints'

const route = useRoute()
const authStore = useAuthStore()

const order = ref(null)
const newRemark = ref('')
const isInternalRemark = ref(false)
const showReturnDialog = ref(false)
const returnForm = ref({})
const returnReason = ref('')
const showPaymentDialog = ref(false)
const paymentForm = ref({ amount: 0, method: 'BANK', remark: '' })
const showReminderDialog = ref(false)
const reminderForm = ref({ assignee_id: null, title: '', content: '', priority: 'MEDIUM' })
const salesList = ref([])

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

const isBoss = computed(() => authStore.isBoss)
const isSales = computed(() => authStore.isSales)
const isWarehouse = computed(() => authStore.isWarehouse)

const showApproveInquiry = computed(() => {
  return order.value?.status === 'INQUIRY' && (isBoss.value || isSales.value)
})
const showLockStock = computed(() => {
  return order.value?.status === 'INQUIRY_APPROVED' && (isBoss.value || isWarehouse.value)
})
const showDeliver = computed(() => {
  return order.value?.status === 'LOCKED' && (isBoss.value || isWarehouse.value)
})
const showSettle = computed(() => {
  return order.value?.status === 'DELIVERED' && (isBoss.value || isSales.value)
})
const showReturnRequest = computed(() => {
  return ['DELIVERED', 'SETTLED', 'PAID_PARTIAL', 'PAID'].includes(order.value?.status) && (isBoss.value || isSales.value)
})
const showApproveReturn = computed(() => {
  return order.value?.status === 'RETURN_REQUESTED' && isBoss.value
})
const showRejectReturn = computed(() => {
  return order.value?.status === 'RETURN_REQUESTED' && isBoss.value
})
const showPayment = computed(() => {
  return ['SETTLED', 'PAID_PARTIAL', 'OVERDUE'].includes(order.value?.status) && (isBoss.value || isSales.value)
})
const showReminder = computed(() => {
  return ['SETTLED', 'PAID_PARTIAL', 'OVERDUE'].includes(order.value?.status) && isBoss.value
})

const workflowSteps = computed(() => {
  if (!order.value) return []
  const statusOrder = ['INQUIRY', 'INQUIRY_APPROVED', 'LOCKED', 'DELIVERED', 'SETTLED', 'PAID_PARTIAL', 'PAID']
  const stepDefs = [
    { title: '创建询价', matchStatus: 'INQUIRY' },
    { title: '确认询价', matchStatus: 'INQUIRY_APPROVED' },
    { title: '锁库', matchStatus: 'LOCKED' },
    { title: '出库', matchStatus: 'DELIVERED' },
    { title: '结算', matchStatus: 'SETTLED' },
    { title: '回款确认', matchStatus: null },
  ]

  const logs = order.value.status_logs || []
  const currentStatus = order.value.status
  const currentStatusIdx = statusOrder.indexOf(currentStatus)

  const steps = stepDefs.map((def, index) => {
    let isCompleted, isCurrent

    if (index === 5) {
      isCompleted = ['PAID_PARTIAL', 'PAID'].includes(currentStatus)
      isCurrent = currentStatus === 'PAID_PARTIAL'
    } else {
      const defIdx = statusOrder.indexOf(def.matchStatus)
      isCompleted = currentStatusIdx > defIdx || (currentStatusIdx === defIdx && index < 5)
      isCurrent = currentStatusIdx === defIdx && !['PAID_PARTIAL', 'PAID'].includes(currentStatus)
    }

    const statusText = isCompleted ? '完成' : isCurrent ? '进行中' : '待处理'
    const type = isCompleted ? 'success' : isCurrent ? 'warning' : 'info'

    let log = null
    if (index === 5) {
      log = logs.find(l => ['PAID_PARTIAL', 'PAID'].includes(l.to_status))
    } else {
      log = logs.find(l => l.to_status === def.matchStatus)
    }

    const description = log
      ? `${log.operator_name} - ${formatDate(log.created_at)}${log.remark ? ` · ${log.remark}` : ''}`
      : ''

    return { title: def.title, statusText, type, description }
  })

  if (['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED'].includes(currentStatus)) {
    const returnLog = logs.find(l => l.to_status === 'RETURN_REQUESTED')
    steps.push({
      title: '退货申请',
      statusText: currentStatus === 'RETURN_REQUESTED' ? '进行中' : '完成',
      type: currentStatus === 'RETURN_REQUESTED' ? 'warning' : 'success',
      description: returnLog ? `${returnLog.operator_name} - ${formatDate(returnLog.created_at)}${returnLog.remark ? ` · ${returnLog.remark}` : ''}` : ''
    })
  }

  return steps
})

const currentStep = computed(() => {
  if (!order.value) return 0
  const statusMap = {
    INQUIRY: 0, INQUIRY_APPROVED: 1, LOCKED: 2, DELIVERED: 3, SETTLED: 4,
    PAID_PARTIAL: 5, PAID: 6, OVERDUE: 5,
    RETURN_REQUESTED: 5, RETURN_APPROVED: 6, RETURN_REJECTED: 6
  }
  return statusMap[order.value.status] ?? 0
})

const loadOrder = async () => {
  order.value = await getOrder(route.params.id)
  order.value.items.forEach(item => {
    returnForm.value[item.id] = 0
  })
  reminderForm.value.title = `${order.value.customer_name}回款催办`
  reminderForm.value.content = `订单 ${order.value.order_no} 未回款金额 ¥${formatMoney(order.value.unpaid_amount)}，请及时催办。`
}

const loadSalesList = async () => {
  try {
    const users = await getSalesList()
    salesList.value = users
  } catch {
    salesList.value = []
  }
}

const addRemark = async () => {
  try {
    await addOrderRemark(order.value.id, { content: newRemark.value, is_internal: isInternalRemark.value })
    newRemark.value = ''
    isInternalRemark.value = false
    ElMessage.success('备注已添加')
    loadOrder()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const handleApproveInquiry = async () => {
  try {
    await approveInquiry(order.value.id, '')
    ElMessage.success('询价已确认')
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleLockStock = async () => {
  try {
    await lockStock(order.value.id, '')
    ElMessage.success('已锁库')
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleDeliver = async () => {
  try {
    await deliverOrder(order.value.id, '')
    ElMessage.success('已出库')
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleSettle = async () => {
  try {
    await settleOrder(order.value.id, '')
    ElMessage.success('已结算')
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const submitReturn = async () => {
  const items = Object.entries(returnForm.value)
    .filter(([_, qty]) => qty > 0)
    .map(([id, quantity]) => ({ item_id: parseInt(id), quantity, reason: returnReason.value }))
  
  if (items.length === 0) {
    ElMessage.warning('请选择退货数量')
    return
  }

  try {
    await requestReturn(order.value.id, { items, remark: returnReason.value })
    ElMessage.success('退货申请已提交')
    showReturnDialog.value = false
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleApproveReturn = async () => {
  try {
    await approveReturn(order.value.id, '')
    ElMessage.success('退货已批准')
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const handleRejectReturn = async () => {
  try {
    await rejectReturn(order.value.id, '')
    ElMessage.success('退货已驳回')
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const submitPayment = async () => {
  if (!paymentForm.value.amount) {
    ElMessage.warning('请输入金额')
    return
  }
  try {
    await createPayment({ order_id: order.value.id, ...paymentForm.value })
    ElMessage.success('回款已登记')
    showPaymentDialog.value = false
    paymentForm.value = { amount: 0, method: 'BANK', remark: '' }
    loadOrder()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const submitReminder = async () => {
  if (!reminderForm.value.assignee_id) {
    ElMessage.warning('请选择责任人')
    return
  }
  try {
    await createReminder({ order_id: order.value.id, ...reminderForm.value })
    ElMessage.success('催办已创建')
    showReminderDialog.value = false
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

onMounted(() => {
  loadOrder()
  loadSalesList()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-primary { font-size: 18px; font-weight: bold; color: #409EFF; }
.amount-success { font-size: 18px; font-weight: bold; color: #67c23a; }
.amount-warning { font-size: 18px; font-weight: bold; color: #e6a23c; }
.amount-danger { font-size: 18px; font-weight: bold; color: #f56c6c; }

.return-tag {
  color: #f56c6c;
  background: #fef0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.remark-input {
  margin-bottom: 20px;
}

.remark-list {
  max-height: 400px;
  overflow-y: auto;
}

.remark-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.remark-item:last-child {
  border-bottom: none;
}

.remark-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.remark-author {
  font-weight: 500;
  color: #333;
}

.remark-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.remark-content {
  color: #606266;
  line-height: 1.5;
}
</style>
